/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ɵC as C, ɵD as D, ɵE as E, ɵT as T, ɵV as V, ɵb as b, ɵb1 as b1, ɵc as c, ɵcR as cR, ɵcr as cr, ɵdefineComponent as defineComponent, ɵdetectChanges as _detectChanges, ɵe as e, ɵp as p, ɵs as s, ɵt as t, ɵv as v} from '@angular/core';
import {ComponentDef} from '@angular/core/src/render3/definition_interfaces';

import {TreeNode, buildTree, emptyTree} from '../util';

export function destroyDom(component: TreeComponent) {
  component.data = emptyTree;
  _detectChanges(component);
}

export function createDom(component: TreeComponent) {
  component.data = buildTree();
  _detectChanges(component);
}

const numberOfChecksEl = document.getElementById('numberOfChecks') !;
let detectChangesRuns = 0;
export function detectChanges(component: TreeComponent) {
  for (let i = 0; i < 10; i++) {
    _detectChanges(component);
  }
  detectChangesRuns += 10;
  numberOfChecksEl.textContent = `${detectChangesRuns}`;
}

export class TreeComponent {
  data: TreeNode = emptyTree;

  /** @nocollapse */
  static ngComponentDef: ComponentDef<TreeComponent> = defineComponent({
    type: TreeComponent,
    tag: 'tree',
    template: function(ctx: TreeComponent, cm: boolean) {
      if (cm) {
        E(0, 'span');
        { T(1); }
        e();
        C(2);
        c();
        C(3);
        c();
      }
      s(0, 'background-color', b(ctx.data.depth % 2 ? '' : 'grey'));
      t(1, b1(' ', ctx.data.value, ' '));
      cR(2);
      {
        if (ctx.data.left != null) {
          let cm0 = V(0);
          {
            if (cm0) {
              E(0, TreeComponent.ngComponentDef);
              { D(1, TreeComponent.ngComponentDef.n(), TreeComponent.ngComponentDef); }
              e();
            }
            p(0, 'data', b(ctx.data.left));
            TreeComponent.ngComponentDef.h(1, 0);
            TreeComponent.ngComponentDef.r(1, 0);
          }
          v();
        }
      }
      cr();
      cR(3);
      {
        if (ctx.data.right != null) {
          let cm0 = V(0);
          {
            if (cm0) {
              E(0, TreeComponent.ngComponentDef);
              { D(1, TreeComponent.ngComponentDef.n(), TreeComponent.ngComponentDef); }
              e();
            }
            p(0, 'data', b(ctx.data.right));
            TreeComponent.ngComponentDef.h(1, 0);
            TreeComponent.ngComponentDef.r(1, 0);
          }
          v();
        }
      }
      cr();
    },
    factory: () => new TreeComponent,
    inputs: {data: 'data'}
  });
}

export class TreeFunction extends TreeComponent {
  data: TreeNode = emptyTree;

  /** @nocollapse */
  static ngComponentDef: ComponentDef<TreeFunction> = defineComponent({
    type: TreeFunction,
    tag: 'tree',
    template: function(ctx: TreeFunction, cm: boolean) {
      // bit of a hack
      TreeTpl(ctx.data, cm);
    },
    factory: () => new TreeFunction,
    inputs: {data: 'data'}
  });
}

export function TreeTpl(ctx: TreeNode, cm: boolean) {
  if (cm) {
    E(0, 'span');
    { T(1); }
    e();
    C(2);
    c();
    C(3);
    c();
  }
  s(0, 'background-color', b(ctx.depth % 2 ? '' : 'grey'));
  t(1, b1(' ', ctx.value, ' '));
  cR(2);
  {
    if (ctx.left != null) {
      let cm0 = V(0);
      { TreeTpl(ctx.left, cm0); }
      v();
    }
  }
  cr();
  cR(3);
  {
    if (ctx.right != null) {
      let cm0 = V(0);
      { TreeTpl(ctx.right, cm0); }
      v();
    }
  }
  cr();
}
