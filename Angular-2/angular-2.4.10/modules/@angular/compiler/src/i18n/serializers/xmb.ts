/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {decimalDigest} from '../digest';
import * as i18n from '../i18n_ast';

import {PlaceholderMapper, Serializer} from './serializer';
import * as xml from './xml_helper';

const _MESSAGES_TAG = 'messagebundle';
const _MESSAGE_TAG = 'msg';
const _PLACEHOLDER_TAG = 'ph';
const _EXEMPLE_TAG = 'ex';

const _DOCTYPE = `<!ELEMENT messagebundle (msg)*>
<!ATTLIST messagebundle class CDATA #IMPLIED>

<!ELEMENT msg (#PCDATA|ph|source)*>
<!ATTLIST msg id CDATA #IMPLIED>
<!ATTLIST msg seq CDATA #IMPLIED>
<!ATTLIST msg name CDATA #IMPLIED>
<!ATTLIST msg desc CDATA #IMPLIED>
<!ATTLIST msg meaning CDATA #IMPLIED>
<!ATTLIST msg obsolete (obsolete) #IMPLIED>
<!ATTLIST msg xml:space (default|preserve) "default">
<!ATTLIST msg is_hidden CDATA #IMPLIED>

<!ELEMENT source (#PCDATA)>

<!ELEMENT ph (#PCDATA|ex)*>
<!ATTLIST ph name CDATA #REQUIRED>

<!ELEMENT ex (#PCDATA)>`;

export class Xmb extends Serializer {
  write(messages: i18n.Message[]): string {
    const exampleVisitor = new ExampleVisitor();
    const visitor = new _Visitor();
    const visited: {[id: string]: boolean} = {};
    let rootNode = new xml.Tag(_MESSAGES_TAG);

    messages.forEach(message => {
      const id = this.digest(message);

      // deduplicate messages
      if (visited[id]) return;
      visited[id] = true;

      const mapper = this.createNameMapper(message);

      const attrs: {[k: string]: string} = {id};

      if (message.description) {
        attrs['desc'] = message.description;
      }

      if (message.meaning) {
        attrs['meaning'] = message.meaning;
      }

      rootNode.children.push(
          new xml.CR(2),
          new xml.Tag(_MESSAGE_TAG, attrs, visitor.serialize(message.nodes, {mapper})));
    });

    rootNode.children.push(new xml.CR());

    return xml.serialize([
      new xml.Declaration({version: '1.0', encoding: 'UTF-8'}),
      new xml.CR(),
      new xml.Doctype(_MESSAGES_TAG, _DOCTYPE),
      new xml.CR(),
      exampleVisitor.addDefaultExamples(rootNode),
      new xml.CR(),
    ]);
  }

  load(content: string, url: string): {[msgId: string]: i18n.Node[]} {
    throw new Error('Unsupported');
  }

  digest(message: i18n.Message): string { return digest(message); }


  createNameMapper(message: i18n.Message): PlaceholderMapper {
    return new XmbPlaceholderMapper(message);
  }
}

class _Visitor implements i18n.Visitor {
  visitText(text: i18n.Text, ctx: {mapper: PlaceholderMapper}): xml.Node[] {
    return [new xml.Text(text.value)];
  }

  visitContainer(container: i18n.Container, ctx: any): xml.Node[] {
    const nodes: xml.Node[] = [];
    container.children.forEach((node: i18n.Node) => nodes.push(...node.visit(this, ctx)));
    return nodes;
  }

  visitIcu(icu: i18n.Icu, ctx: {mapper: PlaceholderMapper}): xml.Node[] {
    const nodes = [new xml.Text(`{${icu.expressionPlaceholder}, ${icu.type}, `)];

    Object.keys(icu.cases).forEach((c: string) => {
      nodes.push(new xml.Text(`${c} {`), ...icu.cases[c].visit(this, ctx), new xml.Text(`} `));
    });

    nodes.push(new xml.Text(`}`));

    return nodes;
  }

  visitTagPlaceholder(ph: i18n.TagPlaceholder, ctx: {mapper: PlaceholderMapper}): xml.Node[] {
    const startEx = new xml.Tag(_EXEMPLE_TAG, {}, [new xml.Text(`<${ph.tag}>`)]);
    let name = ctx.mapper.toPublicName(ph.startName);
    const startTagPh = new xml.Tag(_PLACEHOLDER_TAG, {name}, [startEx]);
    if (ph.isVoid) {
      // void tags have no children nor closing tags
      return [startTagPh];
    }

    const closeEx = new xml.Tag(_EXEMPLE_TAG, {}, [new xml.Text(`</${ph.tag}>`)]);
    name = ctx.mapper.toPublicName(ph.closeName);
    const closeTagPh = new xml.Tag(_PLACEHOLDER_TAG, {name}, [closeEx]);

    return [startTagPh, ...this.serialize(ph.children, ctx), closeTagPh];
  }

  visitPlaceholder(ph: i18n.Placeholder, ctx: {mapper: PlaceholderMapper}): xml.Node[] {
    const name = ctx.mapper.toPublicName(ph.name);
    return [new xml.Tag(_PLACEHOLDER_TAG, {name})];
  }

  visitIcuPlaceholder(ph: i18n.IcuPlaceholder, ctx: {mapper: PlaceholderMapper}): xml.Node[] {
    const name = ctx.mapper.toPublicName(ph.name);
    return [new xml.Tag(_PLACEHOLDER_TAG, {name})];
  }

  serialize(nodes: i18n.Node[], ctx: {mapper: PlaceholderMapper}): xml.Node[] {
    return [].concat(...nodes.map(node => node.visit(this, ctx)));
  }
}

export function digest(message: i18n.Message): string {
  return decimalDigest(message);
}

// TC requires at least one non-empty example on placeholders
class ExampleVisitor implements xml.IVisitor {
  addDefaultExamples(node: xml.Node): xml.Node {
    node.visit(this);
    return node;
  }

  visitTag(tag: xml.Tag): void {
    if (tag.name === _PLACEHOLDER_TAG) {
      if (!tag.children || tag.children.length == 0) {
        const exText = new xml.Text(tag.attrs['name'] || '...');
        tag.children = [new xml.Tag(_EXEMPLE_TAG, {}, [exText])];
      }
    } else if (tag.children) {
      tag.children.forEach(node => node.visit(this));
    }
  }

  visitText(text: xml.Text): void {}
  visitDeclaration(decl: xml.Declaration): void {}
  visitDoctype(doctype: xml.Doctype): void {}
}

/**
 * XMB/XTB placeholders can only contain A-Z, 0-9 and _
 *
 * Because such restrictions do not exist on placeholder names generated locally, the
 * `PlaceholderMapper` is used to convert internal names to XMB names when the XMB file is
 * serialized and back from XTB to internal names when an XTB is loaded.
 */
export class XmbPlaceholderMapper implements PlaceholderMapper, i18n.Visitor {
  private internalToXmb: {[k: string]: string} = {};
  private xmbToNextId: {[k: string]: number} = {};
  private xmbToInternal: {[k: string]: string} = {};

  // create a mapping from the message
  constructor(message: i18n.Message) { message.nodes.forEach(node => node.visit(this)); }

  toPublicName(internalName: string): string {
    return this.internalToXmb.hasOwnProperty(internalName) ? this.internalToXmb[internalName] :
                                                             null;
  }

  toInternalName(publicName: string): string {
    return this.xmbToInternal.hasOwnProperty(publicName) ? this.xmbToInternal[publicName] : null;
  }

  visitText(text: i18n.Text, ctx?: any): any { return null; }

  visitContainer(container: i18n.Container, ctx?: any): any {
    container.children.forEach(child => child.visit(this));
  }

  visitIcu(icu: i18n.Icu, ctx?: any): any {
    Object.keys(icu.cases).forEach(k => { icu.cases[k].visit(this); });
  }

  visitTagPlaceholder(ph: i18n.TagPlaceholder, ctx?: any): any {
    this.addPlaceholder(ph.startName);
    ph.children.forEach(child => child.visit(this));
    this.addPlaceholder(ph.closeName);
  }

  visitPlaceholder(ph: i18n.Placeholder, ctx?: any): any { this.addPlaceholder(ph.name); }

  visitIcuPlaceholder(ph: i18n.IcuPlaceholder, ctx?: any): any { this.addPlaceholder(ph.name); }

  // XMB placeholders could only contains A-Z, 0-9 and _
  private addPlaceholder(internalName: string): void {
    if (!internalName || this.internalToXmb.hasOwnProperty(internalName)) {
      return;
    }

    let xmbName = internalName.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

    if (this.xmbToInternal.hasOwnProperty(xmbName)) {
      // Create a new XMB when it has already been used
      const nextId = this.xmbToNextId[xmbName];
      this.xmbToNextId[xmbName] = nextId + 1;
      xmbName = `${xmbName}_${nextId}`;
    } else {
      this.xmbToNextId[xmbName] = 1;
    }

    this.internalToXmb[internalName] = xmbName;
    this.xmbToInternal[xmbName] = internalName;
  }
}
