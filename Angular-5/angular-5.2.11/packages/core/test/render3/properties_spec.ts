/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {EventEmitter} from '@angular/core';

import {C, D, E, L, T, V, b, b1, c, cR, cr, defineComponent, defineDirective, e, p, t, v} from '../../src/render3/index';
import {NO_CHANGE} from '../../src/render3/instructions';

import {renderToHtml} from './render_util';

describe('elementProperty', () => {

  it('should support bindings to properties', () => {
    function Template(ctx: any, cm: boolean) {
      if (cm) {
        E(0, 'span');
        e();
      }
      p(0, 'id', b(ctx));
    }

    expect(renderToHtml(Template, 'testId')).toEqual('<span id="testId"></span>');
    expect(renderToHtml(Template, 'otherId')).toEqual('<span id="otherId"></span>');
  });

  it('should support creation time bindings to properties', () => {
    function expensive(ctx: string): any {
      if (ctx === 'cheapId') {
        return ctx;
      } else {
        throw 'Too expensive!';
      }
    }

    function Template(ctx: string, cm: boolean) {
      if (cm) {
        E(0, 'span');
        e();
      }
      p(0, 'id', cm ? expensive(ctx) : NO_CHANGE);
    }

    expect(renderToHtml(Template, 'cheapId')).toEqual('<span id="cheapId"></span>');
    expect(renderToHtml(Template, 'expensiveId')).toEqual('<span id="cheapId"></span>');
  });

  it('should support interpolation for properties', () => {
    function Template(ctx: any, cm: boolean) {
      if (cm) {
        E(0, 'span');
        e();
      }
      p(0, 'id', b1('_', ctx, '_'));
    }

    expect(renderToHtml(Template, 'testId')).toEqual('<span id="_testId_"></span>');
    expect(renderToHtml(Template, 'otherId')).toEqual('<span id="_otherId_"></span>');
  });

  describe('input properties', () => {
    let button: MyButton;
    let otherDir: OtherDir;

    class MyButton {
      disabled: boolean;

      static ngDirectiveDef = defineDirective(
          {type: MyButton, factory: () => button = new MyButton(), inputs: {disabled: 'disabled'}});
    }

    class OtherDir {
      id: boolean;
      clickStream = new EventEmitter();

      static ngDirectiveDef = defineDirective({
        type: OtherDir,
        factory: () => otherDir = new OtherDir(),
        inputs: {id: 'id'},
        outputs: {clickStream: 'click'}
      });
    }

    it('should check input properties before setting (directives)', () => {

      /** <button myButton [id]="id" [disabled]="isDisabled">Click me</button> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'button');
          {
            D(1, MyButton.ngDirectiveDef.n(), MyButton.ngDirectiveDef);
            D(2, OtherDir.ngDirectiveDef.n(), OtherDir.ngDirectiveDef);
            T(3, 'Click me');
          }
          e();
        }

        p(0, 'disabled', b(ctx.isDisabled));
        p(0, 'id', b(ctx.id));
      }

      const ctx: any = {isDisabled: true, id: 0};
      expect(renderToHtml(Template, ctx)).toEqual(`<button>Click me</button>`);
      expect(button !.disabled).toEqual(true);
      expect(otherDir !.id).toEqual(0);

      ctx.isDisabled = false;
      ctx.id = 1;
      expect(renderToHtml(Template, ctx)).toEqual(`<button>Click me</button>`);
      expect(button !.disabled).toEqual(false);
      expect(otherDir !.id).toEqual(1);
    });

    it('should support mixed element properties and input properties', () => {

      /** <button myButton [id]="id" [disabled]="isDisabled">Click me</button> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'button');
          {
            D(1, MyButton.ngDirectiveDef.n(), MyButton.ngDirectiveDef);
            T(2, 'Click me');
          }
          e();
        }

        p(0, 'disabled', b(ctx.isDisabled));
        p(0, 'id', b(ctx.id));
      }

      const ctx: any = {isDisabled: true, id: 0};
      expect(renderToHtml(Template, ctx)).toEqual(`<button id="0">Click me</button>`);
      expect(button !.disabled).toEqual(true);

      ctx.isDisabled = false;
      ctx.id = 1;
      expect(renderToHtml(Template, ctx)).toEqual(`<button id="1">Click me</button>`);
      expect(button !.disabled).toEqual(false);
    });

    it('should check that property is not an input property before setting (component)', () => {
      let comp: Comp;
      class Comp {
        id: number;

        static ngComponentDef = defineComponent({
          tag: 'comp',
          type: Comp,
          template: function(ctx: any, cm: boolean) {},
          factory: () => comp = new Comp(),
          inputs: {id: 'id'}
        });
      }

      /** <comp [id]="id"></comp> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, Comp.ngComponentDef);
          { D(1, Comp.ngComponentDef.n(), Comp.ngComponentDef); }
          e();
        }
        p(0, 'id', b(ctx.id));
        Comp.ngComponentDef.h(1, 0);
        Comp.ngComponentDef.r(1, 0);
      }

      expect(renderToHtml(Template, {id: 1})).toEqual(`<comp></comp>`);
      expect(comp !.id).toEqual(1);

      expect(renderToHtml(Template, {id: 2})).toEqual(`<comp></comp>`);
      expect(comp !.id).toEqual(2);
    });

    it('should support two input properties with the same name', () => {
      let otherDisabledDir: OtherDisabledDir;

      class OtherDisabledDir {
        disabled: boolean;

        static ngDirectiveDef = defineDirective({
          type: OtherDisabledDir,
          factory: () => otherDisabledDir = new OtherDisabledDir(),
          inputs: {disabled: 'disabled'}
        });
      }

      /** <button myButton otherDisabledDir [disabled]="isDisabled">Click me</button> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'button');
          {
            D(1, MyButton.ngDirectiveDef.n(), MyButton.ngDirectiveDef);
            D(2, OtherDisabledDir.ngDirectiveDef.n(), OtherDisabledDir.ngDirectiveDef);
            T(3, 'Click me');
          }
          e();
        }
        p(0, 'disabled', b(ctx.isDisabled));
      }

      const ctx: any = {isDisabled: true};
      expect(renderToHtml(Template, ctx)).toEqual(`<button>Click me</button>`);
      expect(button !.disabled).toEqual(true);
      expect(otherDisabledDir !.disabled).toEqual(true);

      ctx.isDisabled = false;
      expect(renderToHtml(Template, ctx)).toEqual(`<button>Click me</button>`);
      expect(button !.disabled).toEqual(false);
      expect(otherDisabledDir !.disabled).toEqual(false);
    });

    it('should set input property if there is an output first', () => {
      /** <button otherDir [id]="id" (click)="onClick()">Click me</button> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'button');
          {
            D(1, OtherDir.ngDirectiveDef.n(), OtherDir.ngDirectiveDef);
            L('click', ctx.onClick.bind(ctx));
            T(2, 'Click me');
          }
          e();
        }
        p(0, 'id', b(ctx.id));
      }

      let counter = 0;
      const ctx: any = {id: 1, onClick: () => counter++};
      expect(renderToHtml(Template, ctx)).toEqual(`<button>Click me</button>`);
      expect(otherDir !.id).toEqual(1);

      otherDir !.clickStream.next();
      expect(counter).toEqual(1);

      ctx.id = 2;
      renderToHtml(Template, ctx);
      expect(otherDir !.id).toEqual(2);
    });

    it('should support unrelated element properties at same index in if-else block', () => {
      let idDir: IdDir;

      class IdDir {
        idNumber: number;

        static ngDirectiveDef = defineDirective(
            {type: IdDir, factory: () => idDir = new IdDir(), inputs: {idNumber: 'id'}});
      }

      /**
       * <button idDir [id]="id1">Click me</button>             // inputs: {'id': [0, 'idNumber']}
       * % if (condition) {
       *   <button [id]="id2">Click me too</button>             // inputs: null
       * % } else {
       *   <button otherDir [id]="id3">Click me too</button>   // inputs: {'id': [0, 'id']}
       * % }
       */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'button');
          {
            D(1, IdDir.ngDirectiveDef.n(), IdDir.ngDirectiveDef);
            T(2, 'Click me');
          }
          e();
          C(3);
          c();
        }
        p(0, 'id', b(ctx.id1));
        cR(3);
        {
          if (ctx.condition) {
            if (V(0)) {
              E(0, 'button');
              { T(1, 'Click me too'); }
              e();
            }
            p(0, 'id', b(ctx.id2));
            v();
          } else {
            if (V(1)) {
              E(0, 'button');
              {
                D(1, OtherDir.ngDirectiveDef.n(), OtherDir.ngDirectiveDef);
                T(2, 'Click me too');
              }
              e();
            }
            p(0, 'id', b(ctx.id3));
            v();
          }
        }
        cr();
      }

      expect(renderToHtml(Template, {condition: true, id1: 'one', id2: 'two', id3: 'three'}))
          .toEqual(`<button>Click me</button><button id="two">Click me too</button>`);
      expect(idDir !.idNumber).toEqual('one');

      expect(renderToHtml(Template, {condition: false, id1: 'four', id2: 'two', id3: 'three'}))
          .toEqual(`<button>Click me</button><button>Click me too</button>`);
      expect(idDir !.idNumber).toEqual('four');
      expect(otherDir !.id).toEqual('three');
    });

  });

  describe('attributes and input properties', () => {
    let myDir: MyDir;
    class MyDir {
      role: string;
      direction: string;
      changeStream = new EventEmitter();

      static ngDirectiveDef = defineDirective({
        type: MyDir,
        factory: () => myDir = new MyDir(),
        inputs: {role: 'role', direction: 'dir'},
        outputs: {changeStream: 'change'}
      });
    }

    let dirB: MyDirB;
    class MyDirB {
      roleB: string;

      static ngDirectiveDef = defineDirective(
          {type: MyDirB, factory: () => dirB = new MyDirB(), inputs: {roleB: 'role'}});
    }

    it('should set input property based on attribute if existing', () => {

      /** <div role="button" myDir></div> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'div', ['role', 'button']);
          { D(1, MyDir.ngDirectiveDef.n(), MyDir.ngDirectiveDef); }
          e();
        }
      }

      expect(renderToHtml(Template, {})).toEqual(`<div role="button"></div>`);
      expect(myDir !.role).toEqual('button');
    });

    it('should set input property and attribute if both defined', () => {

      /** <div role="button" [role]="role" myDir></div> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'div', ['role', 'button']);
          { D(1, MyDir.ngDirectiveDef.n(), MyDir.ngDirectiveDef); }
          e();
        }
        p(0, 'role', b(ctx.role));
      }

      expect(renderToHtml(Template, {role: 'listbox'})).toEqual(`<div role="button"></div>`);
      expect(myDir !.role).toEqual('listbox');

      renderToHtml(Template, {role: 'button'});
      expect(myDir !.role).toEqual('button');
    });

    it('should set two directive input properties based on same attribute', () => {

      /** <div role="button" myDir myDirB></div> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'div', ['role', 'button']);
          {
            D(1, MyDir.ngDirectiveDef.n(), MyDir.ngDirectiveDef);
            D(2, MyDirB.ngDirectiveDef.n(), MyDirB.ngDirectiveDef);
          }
          e();
        }
      }

      expect(renderToHtml(Template, {})).toEqual(`<div role="button"></div>`);
      expect(myDir !.role).toEqual('button');
      expect(dirB !.roleB).toEqual('button');
    });

    it('should process two attributes on same directive', () => {

      /** <div role="button" dir="rtl" myDir></div> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'div', ['role', 'button', 'dir', 'rtl']);
          { D(1, MyDir.ngDirectiveDef.n(), MyDir.ngDirectiveDef); }
          e();
        }
      }

      expect(renderToHtml(Template, {})).toEqual(`<div dir="rtl" role="button"></div>`);
      expect(myDir !.role).toEqual('button');
      expect(myDir !.direction).toEqual('rtl');
    });

    it('should process attributes and outputs properly together', () => {

      /** <div role="button" (change)="onChange()" myDir></div> */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'div', ['role', 'button']);
          {
            D(1, MyDir.ngDirectiveDef.n(), MyDir.ngDirectiveDef);
            L('change', ctx.onChange.bind(ctx));
          }
          e();
        }
      }

      let counter = 0;
      expect(renderToHtml(Template, {
        onChange: () => counter++
      })).toEqual(`<div role="button"></div>`);
      expect(myDir !.role).toEqual('button');

      myDir !.changeStream.next();
      expect(counter).toEqual(1);
    });

    it('should process attributes properly for directives with later indices', () => {


      /**
       * <div role="button" dir="rtl" myDir></div>
       * <div role="listbox" myDirB></div>
       */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'div', ['role', 'button', 'dir', 'rtl']);
          { D(1, MyDir.ngDirectiveDef.n(), MyDir.ngDirectiveDef); }
          e();
          E(2, 'div', ['role', 'listbox']);
          { D(3, MyDirB.ngDirectiveDef.n(), MyDirB.ngDirectiveDef); }
          e();
        }
      }

      expect(renderToHtml(Template, {}))
          .toEqual(`<div dir="rtl" role="button"></div><div role="listbox"></div>`);
      expect(myDir !.role).toEqual('button');
      expect(myDir !.direction).toEqual('rtl');
      expect(dirB !.roleB).toEqual('listbox');
    });

    it('should support attributes at same index inside an if-else block', () => {
      /**
       * <div role="listbox" myDir></div>          // initialInputs: [['role', 'listbox']]
       *
       * % if (condition) {
       *   <div role="button" myDirB></div>       // initialInputs: [['role', 'button']]
       * % } else {
       *   <div role="menu"></div>               // initialInputs: [null]
       * % }
       */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          E(0, 'div', ['role', 'listbox']);
          { D(1, MyDir.ngDirectiveDef.n(), MyDir.ngDirectiveDef); }
          e();
          C(2);
          c();
        }
        cR(2);
        {
          if (ctx.condition) {
            if (V(0)) {
              E(0, 'div', ['role', 'button']);
              { D(1, MyDirB.ngDirectiveDef.n(), MyDirB.ngDirectiveDef); }
              e();
            }
            v();
          } else {
            if (V(1)) {
              E(0, 'div', ['role', 'menu']);
              {}
              e();
            }
            v();
          }
        }
        cr();
      }

      expect(renderToHtml(Template, {
        condition: true
      })).toEqual(`<div role="listbox"></div><div role="button"></div>`);
      expect(myDir !.role).toEqual('listbox');
      expect(dirB !.roleB).toEqual('button');
      expect((dirB !as any).role).toBeUndefined();

      expect(renderToHtml(Template, {
        condition: false
      })).toEqual(`<div role="listbox"></div><div role="menu"></div>`);
      expect(myDir !.role).toEqual('listbox');
    });

    it('should process attributes properly inside a for loop', () => {

      class Comp {
        static ngComponentDef = defineComponent({
          tag: 'comp',
          type: Comp,
          template: function(ctx: any, cm: boolean) {
            if (cm) {
              E(0, 'div', ['role', 'button']);
              { D(1, MyDir.ngDirectiveDef.n(), MyDir.ngDirectiveDef); }
              e();
              T(2);
            }
            t(2, b(D<MyDir>(1).role));
          },
          factory: () => new Comp()
        });
      }

      /**
       * % for (let i = 0; i < 3; i++) {
       *     <comp></comp>
       * % }
       */
      function Template(ctx: any, cm: boolean) {
        if (cm) {
          C(0);
          c();
        }
        cR(0);
        {
          for (let i = 0; i < 2; i++) {
            if (V(0)) {
              E(0, Comp.ngComponentDef);
              { D(1, Comp.ngComponentDef.n(), Comp.ngComponentDef); }
              e();
            }
            Comp.ngComponentDef.h(1, 0);
            Comp.ngComponentDef.r(1, 0);
            v();
          }
        }
        cr();
      }

      expect(renderToHtml(Template, {}))
          .toEqual(
              `<comp><div role="button"></div>button</comp><comp><div role="button"></div>button</comp>`);
    });

  });

});
