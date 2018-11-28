/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {DirectiveResolver} from '@angular/compiler';
import {Directive, Type} from '@angular/core';

const COMPONENT_SELECTOR = /^[\w|-]*$/;
const directiveResolver = new DirectiveResolver();

export interface AttrProp {
  prop: string;
  attr: string;
  bracketAttr: string;
  bracketParenAttr: string;
  parenAttr: string;
  onAttr: string;
  bindAttr: string;
  bindonAttr: string;
}

export interface ComponentInfo {
  type: Type<any>;
  selector: string;
  inputs?: AttrProp[];
  outputs?: AttrProp[];
}

export function getComponentInfo(type: Type<any>): ComponentInfo {
  const resolvedMetadata: Directive = directiveResolver.resolve(type);
  const selector = resolvedMetadata.selector;
  return {
    type: type,
    selector: selector,
    inputs: parseFields(resolvedMetadata.inputs),
    outputs: parseFields(resolvedMetadata.outputs)
  };
}

export function parseFields(names: string[]): AttrProp[] {
  const attrProps: AttrProp[] = [];
  if (names) {
    for (let i = 0; i < names.length; i++) {
      const parts = names[i].split(':');
      const prop = parts[0].trim();
      const attr = (parts[1] || parts[0]).trim();
      const capitalAttr = attr.charAt(0).toUpperCase() + attr.substr(1);
      attrProps.push(<AttrProp>{
        prop: prop,
        attr: attr,
        bracketAttr: `[${attr}]`,
        parenAttr: `(${attr})`,
        bracketParenAttr: `[(${attr})]`,
        onAttr: `on${capitalAttr}`,
        bindAttr: `bind${capitalAttr}`,
        bindonAttr: `bindon${capitalAttr}`
      });
    }
  }
  return attrProps;
}
