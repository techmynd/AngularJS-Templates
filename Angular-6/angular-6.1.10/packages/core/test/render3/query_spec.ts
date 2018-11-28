/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {NgForOfContext} from '@angular/common';
import {ElementRef, TemplateRef, ViewContainerRef} from '@angular/core';

import {EventEmitter} from '../..';
import {QUERY_READ_CONTAINER_REF, QUERY_READ_ELEMENT_REF, QUERY_READ_FROM_NODE, QUERY_READ_TEMPLATE_REF, getOrCreateNodeInjectorForNode, getOrCreateTemplateRef} from '../../src/render3/di';
import {AttributeMarker, QueryList, defineComponent, defineDirective, detectChanges, injectViewContainerRef} from '../../src/render3/index';
import {bind, container, containerRefreshEnd, containerRefreshStart, element, elementEnd, elementProperty, elementStart, embeddedViewEnd, embeddedViewStart, load, loadDirective, loadQueryList, registerContentQuery} from '../../src/render3/instructions';
import {RenderFlags} from '../../src/render3/interfaces/definition';
import {query, queryRefresh} from '../../src/render3/query';

import {NgForOf, NgIf, NgTemplateOutlet} from './common_with_def';
import {ComponentFixture, TemplateFixture, createComponent, createDirective, renderComponent} from './render_util';



/**
 * Helper function to check if a given candidate object resembles ElementRef
 * @param candidate
 * @returns true if `ElementRef`.
 */
function isElementRef(candidate: any): boolean {
  return candidate.nativeElement != null;
}

/**
 * Helper function to check if a given candidate object resembles TemplateRef
 * @param candidate
 * @returns true if `TemplateRef`.
 */
function isTemplateRef(candidate: any): boolean {
  return candidate.createEmbeddedView != null && candidate.createComponent == null;
}

/**
 * Helper function to check if a given candidate object resembles ViewContainerRef
 * @param candidate
 * @returns true if `ViewContainerRef`.
 */
function isViewContainerRef(candidate: any): boolean {
  return candidate.createEmbeddedView != null && candidate.createComponent != null;
}

describe('query', () => {
  it('should project query children', () => {
    const Child = createComponent('child', function(rf: RenderFlags, ctx: any) {});

    let child1 = null;
    let child2 = null;
    const Cmp = createComponent(
        'cmp',
        function(rf: RenderFlags, ctx: any) {
          /**
           * <child>
           *   <child>
           *   </child>
           * </child>
           * class Cmp {
           *   @ViewChildren(Child) query0;
           *   @ViewChildren(Child, {descend: true}) query1;
           * }
           */
          if (rf & RenderFlags.Create) {
            elementStart(2, 'child');
            { element(3, 'child'); }
            elementEnd();
          }
          if (rf & RenderFlags.Update) {
            child1 = loadDirective(0);
            child2 = loadDirective(1);
          }
        },
        [Child], [],
        function(rf: RenderFlags, ctx: any) {
          if (rf & RenderFlags.Create) {
            query(0, Child, false);
            query(1, Child, true);
          }
          if (rf & RenderFlags.Update) {
            let tmp: any;
            queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query0 = tmp as QueryList<any>);
            queryRefresh(tmp = load<QueryList<any>>(1)) && (ctx.query1 = tmp as QueryList<any>);
          }
        });

    const parent = renderComponent(Cmp);
    expect((parent.query0 as QueryList<any>).toArray()).toEqual([child1]);
    expect((parent.query1 as QueryList<any>).toArray()).toEqual([child1, child2]);
  });

  describe('predicate', () => {
    describe('types', () => {

      it('should query using type predicate and read a specified token', () => {
        const Child = createDirective('child');
        let elToQuery;
        /**
         * <div child></div>
         * class Cmpt {
         *  @ViewChildren(Child, {read: ElementRef}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                elToQuery = elementStart(1, 'div', ['child', '']);
                elementEnd();
              }
            },
            [Child], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, Child, false, QUERY_READ_ELEMENT_REF);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(isElementRef(qList.first)).toBeTruthy();
        expect(qList.first.nativeElement).toBe(elToQuery);
      });

      it('should query using type predicate and read another directive type', () => {
        const Child = createDirective('child');
        const OtherChild = createDirective('otherChild');
        let otherChildInstance;
        /**
         * <div child otherChild></div>
         * class Cmpt {
         *  @ViewChildren(Child, {read: OtherChild}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                elementStart(1, 'div', ['child', '', 'otherChild', '']);
                { otherChildInstance = loadDirective(1); }
                elementEnd();
              }
            },
            [Child, OtherChild], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, Child, false, OtherChild);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(qList.first).toBe(otherChildInstance);
      });

      it('should not add results to query if a requested token cant be read', () => {
        const Child = createDirective('child');
        const OtherChild = createDirective('otherChild');
        /**
         * <div child></div>
         * class Cmpt {
         *  @ViewChildren(Child, {read: OtherChild}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                elementStart(1, 'div', ['child', '']);
                elementEnd();
              }
            },
            [Child, OtherChild], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, Child, false, OtherChild);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(0);
      });
    });

    describe('local names', () => {

      it('should query for a single element and read ElementRef by default', () => {

        let elToQuery;
        /**
         * <div #foo></div>
         * <div></div>
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                elToQuery = elementStart(1, 'div', null, ['foo', '']);
                elementEnd();
                elementStart(3, 'div');
                elementEnd();
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], false, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(qList.first.nativeElement).toEqual(elToQuery);
      });

      it('should query multiple locals on the same element', () => {
        let elToQuery;

        /**
         * <div #foo #bar></div>
         * <div></div>
         * class Cmpt {
         *  @ViewChildren('foo') fooQuery;
         *  @ViewChildren('bar') barQuery;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                elToQuery = elementStart(2, 'div', null, ['foo', '', 'bar', '']);
                elementEnd();
                elementStart(5, 'div');
                elementEnd();
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], false, QUERY_READ_FROM_NODE);
                query(1, ['bar'], false, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) &&
                    (ctx.fooQuery = tmp as QueryList<any>);
                queryRefresh(tmp = load<QueryList<any>>(1)) &&
                    (ctx.barQuery = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);

        const fooList = (cmptInstance.fooQuery as QueryList<any>);
        expect(fooList.length).toBe(1);
        expect(fooList.first.nativeElement).toEqual(elToQuery);

        const barList = (cmptInstance.barQuery as QueryList<any>);
        expect(barList.length).toBe(1);
        expect(barList.first.nativeElement).toEqual(elToQuery);
      });

      it('should query for multiple elements and read ElementRef by default', () => {

        let el1ToQuery;
        let el2ToQuery;
        /**
         * <div #foo></div>
         * <div></div>
         * <div #bar></div>
         * class Cmpt {
         *  @ViewChildren('foo,bar') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                el1ToQuery = elementStart(1, 'div', null, ['foo', '']);
                elementEnd();
                elementStart(3, 'div');
                elementEnd();
                el2ToQuery = elementStart(4, 'div', null, ['bar', '']);
                elementEnd();
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo', 'bar'], undefined, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(2);
        expect(qList.first.nativeElement).toEqual(el1ToQuery);
        expect(qList.last.nativeElement).toEqual(el2ToQuery);
      });

      it('should read ElementRef from an element when explicitly asked for', () => {

        let elToQuery;
        /**
         * <div #foo></div>
         * <div></div>
         * class Cmpt {
         *  @ViewChildren('foo', {read: ElementRef}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                elToQuery = elementStart(1, 'div', null, ['foo', '']);
                elementEnd();
                element(3, 'div');
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], false, QUERY_READ_ELEMENT_REF);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(isElementRef(qList.first)).toBeTruthy();
        expect(qList.first.nativeElement).toEqual(elToQuery);
      });

      it('should read ViewContainerRef from element nodes when explicitly asked for', () => {
        /**
         * <div #foo></div>
         * class Cmpt {
         *  @ViewChildren('foo', {read: ViewContainerRef}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                element(1, 'div', null, ['foo', '']);
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], false, QUERY_READ_CONTAINER_REF);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(isViewContainerRef(qList.first)).toBeTruthy();
      });

      it('should read ViewContainerRef from container nodes when explicitly asked for', () => {
        /**
         * <ng-template #foo></ng-template>
         * class Cmpt {
         *  @ViewChildren('foo', {read: ViewContainerRef}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(1, undefined, undefined, undefined, ['foo', '']);
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], false, QUERY_READ_CONTAINER_REF);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(isViewContainerRef(qList.first)).toBeTruthy();
      });

      it('should read ElementRef with a native element pointing to comment DOM node from containers',
         () => {
           /**
            * <ng-template #foo></ng-template>
            * class Cmpt {
            *  @ViewChildren('foo', {read: ElementRef}) query;
            * }
            */
           const Cmpt = createComponent(
               'cmpt',
               function(rf: RenderFlags, ctx: any) {
                 if (rf & RenderFlags.Create) {
                   container(1, undefined, undefined, undefined, ['foo', '']);
                 }
               },
               [], [],
               function(rf: RenderFlags, ctx: any) {

                 if (rf & RenderFlags.Create) {
                   query(0, ['foo'], false, QUERY_READ_ELEMENT_REF);
                 }
                 if (rf & RenderFlags.Update) {
                   let tmp: any;
                   queryRefresh(tmp = load<QueryList<any>>(0)) &&
                       (ctx.query = tmp as QueryList<any>);
                 }
               });

           const cmptInstance = renderComponent(Cmpt);
           const qList = (cmptInstance.query as QueryList<any>);
           expect(qList.length).toBe(1);
           expect(isElementRef(qList.first)).toBeTruthy();
           expect(qList.first.nativeElement.nodeType).toBe(8);  // Node.COMMENT_NODE = 8
         });

      it('should read TemplateRef from container nodes by default', () => {
        // http://plnkr.co/edit/BVpORly8wped9I3xUYsX?p=preview
        /**
         * <ng-template #foo></ng-template>
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(1, undefined, undefined, undefined, ['foo', '']);
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], undefined, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(isTemplateRef(qList.first)).toBeTruthy();
      });


      it('should read TemplateRef from container nodes when explicitly asked for', () => {
        /**
         * <ng-template #foo></ng-template>
         * class Cmpt {
         *  @ViewChildren('foo', {read: TemplateRef}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(1, undefined, undefined, undefined, ['foo', '']);
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], false, QUERY_READ_TEMPLATE_REF);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(isTemplateRef(qList.first)).toBeTruthy();
      });

      it('should read component instance if element queried for is a component host', () => {
        const Child = createComponent('child', function(rf: RenderFlags, ctx: any) {});

        let childInstance;
        /**
         * <child #foo></child>
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                element(1, 'child', null, ['foo', '']);
              }
              if (rf & RenderFlags.Update) {
                childInstance = loadDirective(0);
              }
            },
            [Child], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(qList.first).toBe(childInstance);
      });

      it('should read component instance with explicit exportAs', () => {
        let childInstance: Child;

        class Child {
          static ngComponentDef = defineComponent({
            type: Child,
            selectors: [['child']],
            factory: () => childInstance = new Child(),
            template: (rf: RenderFlags, ctx: Child) => {},
            exportAs: 'child'
          });
        }

        /**
         * <child #foo="child"></child>
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                element(1, 'child', null, ['foo', 'child']);
              }
            },
            [Child], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(qList.first).toBe(childInstance !);
      });

      it('should read directive instance if element queried for has an exported directive with a matching name',
         () => {
           const Child = createDirective('child', {exportAs: 'child'});

           let childInstance;
           /**
            * <div #foo="child" child></div>
            * class Cmpt {
            *  @ViewChildren('foo') query;
            * }
            */
           const Cmpt = createComponent(
               'cmpt',
               function(rf: RenderFlags, ctx: any) {
                 if (rf & RenderFlags.Create) {
                   element(1, 'div', ['child', ''], ['foo', 'child']);
                 }
                 if (rf & RenderFlags.Update) {
                   childInstance = loadDirective(0);
                 }
               },
               [Child], [],
               function(rf: RenderFlags, ctx: any) {
                 if (rf & RenderFlags.Create) {
                   query(0, ['foo'], true, QUERY_READ_FROM_NODE);
                 }
                 if (rf & RenderFlags.Update) {
                   let tmp: any;
                   queryRefresh(tmp = load<QueryList<any>>(0)) &&
                       (ctx.query = tmp as QueryList<any>);
                 }
               });

           const cmptInstance = renderComponent(Cmpt);
           const qList = (cmptInstance.query as QueryList<any>);
           expect(qList.length).toBe(1);
           expect(qList.first).toBe(childInstance);
         });

      it('should read all matching directive instances from a given element', () => {
        const Child1 = createDirective('child1', {exportAs: 'child1'});
        const Child2 = createDirective('child2', {exportAs: 'child2'});

        let child1Instance, child2Instance;
        /**
         * <div #foo="child1" child1 #bar="child2" child2></div>
         * class Cmpt {
         *  @ViewChildren('foo, bar') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                element(1, 'div', ['child1', '', 'child2', ''], ['foo', 'child1', 'bar', 'child2']);
              }
              if (rf & RenderFlags.Update) {
                child1Instance = loadDirective(0);
                child2Instance = loadDirective(1);
              }
            },
            [Child1, Child2], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo', 'bar'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(2);
        expect(qList.first).toBe(child1Instance);
        expect(qList.last).toBe(child2Instance);
      });

      it('should read multiple locals exporting the same directive from a given element', () => {
        const Child = createDirective('child', {exportAs: 'child'});
        let childInstance;

        /**
         * <div child #foo="child" #bar="child"></div>
         * class Cmpt {
         *  @ViewChildren('foo') fooQuery;
         *  @ViewChildren('bar') barQuery;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                element(2, 'div', ['child', ''], ['foo', 'child', 'bar', 'child']);
              }
              if (rf & RenderFlags.Update) {
                childInstance = loadDirective(0);
              }
            },
            [Child], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
                query(1, ['bar'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) &&
                    (ctx.fooQuery = tmp as QueryList<any>);
                queryRefresh(tmp = load<QueryList<any>>(1)) &&
                    (ctx.barQuery = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);

        const fooList = cmptInstance.fooQuery as QueryList<any>;
        expect(fooList.length).toBe(1);
        expect(fooList.first).toBe(childInstance);

        const barList = cmptInstance.barQuery as QueryList<any>;
        expect(barList.length).toBe(1);
        expect(barList.first).toBe(childInstance);
      });

      it('should match on exported directive name and read a requested token', () => {
        const Child = createDirective('child', {exportAs: 'child'});

        let div;
        /**
         * <div #foo="child" child></div>
         * class Cmpt {
         *  @ViewChildren('foo', {read: ElementRef}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                div = elementStart(1, 'div', ['child', ''], ['foo', 'child']);
                elementEnd();
              }
            },
            [Child], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], undefined, QUERY_READ_ELEMENT_REF);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(1);
        expect(qList.first.nativeElement).toBe(div);
      });

      it('should support reading a mix of ElementRef and directive instances', () => {
        const Child = createDirective('child', {exportAs: 'child'});

        let childInstance, div;
        /**
         * <div #foo #bar="child" child></div>
         * class Cmpt {
         *  @ViewChildren('foo, bar') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                div = elementStart(1, 'div', ['child', ''], ['foo', '', 'bar', 'child']);
                elementEnd();
              }
              if (rf & RenderFlags.Update) {
                childInstance = loadDirective(0);
              }
            },
            [Child], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo', 'bar'], undefined, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(2);
        expect(qList.first.nativeElement).toBe(div);
        expect(qList.last).toBe(childInstance);
      });

      it('should not add results to query if a requested token cant be read', () => {
        const Child = createDirective('child');

        /**
         * <div #foo></div>
         * class Cmpt {
         *  @ViewChildren('foo', {read: Child}) query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                element(1, 'div', ['foo', '']);
              }
            },
            [Child], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], false, Child);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as QueryList<any>);
        expect(qList.length).toBe(0);
      });

    });
  });

  describe('view boundaries', () => {

    describe('ViewContainerRef', () => {

      let directiveInstances: ViewContainerManipulatorDirective[] = [];

      class ViewContainerManipulatorDirective {
        static ngDirectiveDef = defineDirective({
          type: ViewContainerManipulatorDirective,
          selectors: [['', 'vc', '']],
          factory: () => {
            const directiveInstance =
                new ViewContainerManipulatorDirective(injectViewContainerRef());
            directiveInstances.push(directiveInstance);
            return directiveInstance;
          }
        });

        constructor(private _vcRef: ViewContainerRef) {}

        insertTpl(tpl: TemplateRef<{}>, ctx: {}, idx?: number) {
          this._vcRef.createEmbeddedView(tpl, ctx, idx);
        }

        remove(index?: number) { this._vcRef.remove(index); }
      }

      beforeEach(() => { directiveInstances = []; });

      it('should report results in views inserted / removed by ngIf', () => {

        /**
         * <ng-template [ngIf]="value">
         *    <div #foo></div>
         * </ng-template>
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(1, (rf1: RenderFlags, ctx1: any) => {
                  if (rf1 & RenderFlags.Create) {
                    elementStart(0, 'div', null, ['foo', '']);
                    elementEnd();
                  }
                }, null, ['ngIf', '']);
              }
              if (rf & RenderFlags.Update) {
                elementProperty(1, 'ngIf', bind(ctx.value));
              }
            },
            [NgIf], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const fixture = new ComponentFixture(Cmpt);
        const qList = fixture.component.query;
        expect(qList.length).toBe(0);

        fixture.component.value = true;
        fixture.update();
        expect(qList.length).toBe(1);

        fixture.component.value = false;
        fixture.update();
        expect(qList.length).toBe(0);
      });

      it('should report results in views inserted / removed by ngFor', () => {

        /**
         * <ng-template ngFor let-item [ngForOf]="value">
         *    <div #foo [id]="item"></div>
         * </ng-template>
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        class Cmpt {
          // TODO(issue/24571): remove '!'.
          value !: string[];
          query: any;
          static ngComponentDef = defineComponent({
            type: Cmpt,
            factory: () => new Cmpt(),
            selectors: [['my-app']],
            template: function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(1, (rf1: RenderFlags, row: NgForOfContext<string>) => {
                  if (rf1 & RenderFlags.Create) {
                    elementStart(0, 'div', null, ['foo', '']);
                    elementEnd();
                  }
                  if (rf1 & RenderFlags.Update) {
                    elementProperty(0, 'id', bind(row.$implicit));
                  }
                }, null, ['ngForOf', '']);
              }
              if (rf & RenderFlags.Update) {
                elementProperty(1, 'ngForOf', bind(ctx.value));
              }
            },
            viewQuery: function(rf: RenderFlags, ctx: Cmpt) {
              let tmp: any;
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            },
            directives: () => [NgForOf]
          });
        }

        const fixture = new ComponentFixture(Cmpt);
        const qList = fixture.component.query;
        expect(qList.length).toBe(0);

        fixture.component.value = ['a', 'b', 'c'];
        fixture.update();
        expect(qList.length).toBe(3);

        fixture.component.value.splice(1, 1);  // remove "b"
        fixture.update();
        expect(qList.length).toBe(2);

        // make sure that a proper element was removed from query results
        expect(qList.first.nativeElement.id).toBe('a');
        expect(qList.last.nativeElement.id).toBe('c');

      });

      // https://stackblitz.com/edit/angular-rrmmuf?file=src/app/app.component.ts
      it('should report results when different instances of TemplateRef are inserted into one ViewContainerRefs',
         () => {
           let tpl1: TemplateRef<{}>;
           let tpl2: TemplateRef<{}>;


           /**
            * <ng-template #tpl1 let-idx="idx">
            *   <div #foo [id]="'foo1_'+idx"></div>
            * </ng-template>
            *
            * <div #foo id="middle"></div>
            *
            * <ng-template #tpl2 let-idx="idx">
            *   <div #foo [id]="'foo2_'+idx"></div>
            * </ng-template>
            *
            * <ng-template viewInserter #vi="vi"></ng-template>
            */
           const Cmpt = createComponent(
               'cmpt',
               function(rf: RenderFlags, ctx: any) {
                 if (rf & RenderFlags.Create) {
                   container(1, (rf: RenderFlags, ctx: {idx: number}) => {
                     if (rf & RenderFlags.Create) {
                       elementStart(0, 'div', null, ['foo', '']);
                       elementEnd();
                     }
                     if (rf & RenderFlags.Update) {
                       elementProperty(0, 'id', bind('foo1_' + ctx.idx));
                     }
                   }, null, []);

                   elementStart(2, 'div', ['id', 'middle'], ['foo', '']);
                   elementEnd();

                   container(4, (rf: RenderFlags, ctx: {idx: number}) => {
                     if (rf & RenderFlags.Create) {
                       elementStart(0, 'div', null, ['foo', '']);
                       elementEnd();
                     }
                     if (rf & RenderFlags.Update) {
                       elementProperty(0, 'id', bind('foo2_' + ctx.idx));
                     }
                   }, null, []);

                   container(5, undefined, null, [AttributeMarker.SelectOnly, 'vc']);
                 }

                 if (rf & RenderFlags.Update) {
                   tpl1 = getOrCreateTemplateRef(getOrCreateNodeInjectorForNode(load(1)));
                   tpl2 = getOrCreateTemplateRef(getOrCreateNodeInjectorForNode(load(4)));
                 }

               },
               [ViewContainerManipulatorDirective], [],
               function(rf: RenderFlags, ctx: any) {
                 if (rf & RenderFlags.Create) {
                   query(0, ['foo'], true, QUERY_READ_FROM_NODE);
                 }
                 if (rf & RenderFlags.Update) {
                   let tmp: any;
                   queryRefresh(tmp = load<QueryList<any>>(0)) &&
                       (ctx.query = tmp as QueryList<any>);
                 }
               });

           const fixture = new ComponentFixture(Cmpt);
           const qList = fixture.component.query;

           expect(qList.length).toBe(1);
           expect(qList.first.nativeElement.getAttribute('id')).toBe('middle');

           directiveInstances[0].insertTpl(tpl1 !, {idx: 0}, 0);
           directiveInstances[0].insertTpl(tpl2 !, {idx: 1}, 1);
           fixture.update();
           expect(qList.length).toBe(3);
           let qListArr = qList.toArray();
           expect(qListArr[0].nativeElement.getAttribute('id')).toBe('foo1_0');
           expect(qListArr[1].nativeElement.getAttribute('id')).toBe('middle');
           expect(qListArr[2].nativeElement.getAttribute('id')).toBe('foo2_1');

           directiveInstances[0].insertTpl(tpl1 !, {idx: 1}, 1);
           fixture.update();
           expect(qList.length).toBe(4);
           qListArr = qList.toArray();
           expect(qListArr[0].nativeElement.getAttribute('id')).toBe('foo1_0');
           expect(qListArr[1].nativeElement.getAttribute('id')).toBe('foo1_1');
           expect(qListArr[2].nativeElement.getAttribute('id')).toBe('middle');
           expect(qListArr[3].nativeElement.getAttribute('id')).toBe('foo2_1');

           directiveInstances[0].remove(1);
           fixture.update();
           expect(qList.length).toBe(3);
           qListArr = qList.toArray();
           expect(qListArr[0].nativeElement.getAttribute('id')).toBe('foo1_0');
           expect(qListArr[1].nativeElement.getAttribute('id')).toBe('middle');
           expect(qListArr[2].nativeElement.getAttribute('id')).toBe('foo2_1');

           directiveInstances[0].remove(1);
           fixture.update();
           expect(qList.length).toBe(2);
           qListArr = qList.toArray();
           expect(qListArr[0].nativeElement.getAttribute('id')).toBe('foo1_0');
           expect(qListArr[1].nativeElement.getAttribute('id')).toBe('middle');
         });

      // https://stackblitz.com/edit/angular-7vvo9j?file=src%2Fapp%2Fapp.component.ts
      it('should report results when the same TemplateRef is inserted into different ViewContainerRefs',
         () => {
           let tpl: TemplateRef<{}>;

           /**
            * <ng-template #tpl let-idx="idx" let-container_idx="container_idx">
            *   <div #foo [id]="'foo_'+container_idx+'_'+idx"></div>
            * </ng-template>
            *
            * <ng-template viewInserter #vi1="vi"></ng-template>
            * <ng-template viewInserter #vi2="vi"></ng-template>
            */
           class Cmpt {
             query: any;
             static ngComponentDef = defineComponent({
               type: Cmpt,
               factory: () => new Cmpt(),
               selectors: [['my-app']],
               template: function(rf: RenderFlags, ctx: any) {
                 let tmp: any;
                 if (rf & RenderFlags.Create) {
                   container(1, (rf: RenderFlags, ctx: {idx: number, container_idx: number}) => {
                     if (rf & RenderFlags.Create) {
                       elementStart(0, 'div', null, ['foo', '']);
                       elementEnd();
                     }
                     if (rf & RenderFlags.Update) {
                       elementProperty(0, 'id', bind('foo_' + ctx.container_idx + '_' + ctx.idx));
                     }
                   }, null, []);

                   container(2, undefined, null, [AttributeMarker.SelectOnly, 'vc']);
                   container(3, undefined, null, [AttributeMarker.SelectOnly, 'vc']);
                 }

                 if (rf & RenderFlags.Update) {
                   tpl = getOrCreateTemplateRef(getOrCreateNodeInjectorForNode(load(1)));
                 }

               },
               viewQuery: (rf: RenderFlags, cmpt: Cmpt) => {
                 let tmp: any;
                 if (rf & RenderFlags.Create) {
                   query(0, ['foo'], true, QUERY_READ_FROM_NODE);
                 }
                 if (rf & RenderFlags.Update) {
                   queryRefresh(tmp = load<QueryList<any>>(0)) &&
                       (cmpt.query = tmp as QueryList<any>);
                 }
               },
               directives: () => [ViewContainerManipulatorDirective],
             });
           }
           const fixture = new ComponentFixture(Cmpt);
           const qList = fixture.component.query;

           expect(qList.length).toBe(0);

           directiveInstances[0].insertTpl(tpl !, {idx: 0, container_idx: 0}, 0);
           directiveInstances[1].insertTpl(tpl !, {idx: 0, container_idx: 1}, 0);
           fixture.update();
           expect(qList.length).toBe(2);
           let qListArr = qList.toArray();
           expect(qListArr[0].nativeElement.getAttribute('id')).toBe('foo_1_0');
           expect(qListArr[1].nativeElement.getAttribute('id')).toBe('foo_0_0');

           directiveInstances[0].remove();
           fixture.update();
           expect(qList.length).toBe(1);
           qListArr = qList.toArray();
           expect(qListArr[0].nativeElement.getAttribute('id')).toBe('foo_1_0');

           directiveInstances[1].remove();
           fixture.update();
           expect(qList.length).toBe(0);
         });

      // https://stackblitz.com/edit/angular-wpd6gv?file=src%2Fapp%2Fapp.component.ts
      it('should report results from views inserted in a lifecycle hook', () => {

        class MyApp {
          show = false;
          query: any;
          static ngComponentDef = defineComponent({
            type: MyApp,
            factory: () => new MyApp(),
            selectors: [['my-app']],
            /**
             * <ng-template #tpl><span #foo id="from_tpl">from tpl</span></ng-template>
             * <ng-template [ngTemplateOutlet]="show ? tpl : null"></ng-template>
             */
            template: (rf: RenderFlags, myApp: MyApp) => {
              if (rf & RenderFlags.Create) {
                container(1, (rf1: RenderFlags) => {
                  if (rf1 & RenderFlags.Create) {
                    element(0, 'span', ['id', 'from_tpl'], ['foo', '']);
                  }
                }, undefined, undefined, ['tpl', '']);
                container(3, undefined, null, [AttributeMarker.SelectOnly, 'ngTemplateOutlet']);
              }
              if (rf & RenderFlags.Update) {
                const tplRef = getOrCreateTemplateRef(getOrCreateNodeInjectorForNode(load(1)));
                elementProperty(3, 'ngTemplateOutlet', bind(myApp.show ? tplRef : null));
              }
            },
            directives: () => [NgTemplateOutlet],
            viewQuery: (rf: RenderFlags, myApp: MyApp) => {
              let tmp: any;
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                queryRefresh(tmp = load<QueryList<any>>(0)) &&
                    (myApp.query = tmp as QueryList<any>);
              }
            }
          });
        }

        const fixture = new ComponentFixture(MyApp);
        const qList = fixture.component.query;

        expect(qList.length).toBe(0);

        fixture.component.show = true;
        fixture.update();
        expect(qList.length).toBe(1);
        expect(qList.first.nativeElement.id).toBe('from_tpl');

        fixture.component.show = false;
        fixture.update();
        expect(qList.length).toBe(0);
      });

    });

    describe('JS blocks', () => {

      it('should report results in embedded views', () => {
        let firstEl;
        /**
         * % if (exp) {
         *    <div #foo></div>
         * % }
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(1);
              }
              if (rf & RenderFlags.Update) {
                containerRefreshStart(1);
                {
                  if (ctx.exp) {
                    let rf1 = embeddedViewStart(1);
                    {
                      if (rf1 & RenderFlags.Create) {
                        firstEl = elementStart(0, 'div', null, ['foo', '']);
                        elementEnd();
                      }
                    }
                    embeddedViewEnd();
                  }
                }
                containerRefreshEnd();
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as any);
        expect(qList.length).toBe(0);

        cmptInstance.exp = true;
        detectChanges(cmptInstance);
        expect(qList.length).toBe(1);
        expect(qList.first.nativeElement).toBe(firstEl);

        cmptInstance.exp = false;
        detectChanges(cmptInstance);
        expect(qList.length).toBe(0);
      });

      it('should add results from embedded views in the correct order - views and elements mix',
         () => {
           let firstEl, lastEl, viewEl;
           /**
            * <span #foo></span>
            * % if (exp) {
            *    <div #foo></div>
            * % }
            * <span #foo></span>
            * class Cmpt {
            *  @ViewChildren('foo') query;
            * }
            */
           const Cmpt = createComponent(
               'cmpt',
               function(rf: RenderFlags, ctx: any) {
                 if (rf & RenderFlags.Create) {
                   firstEl = elementStart(1, 'span', null, ['foo', '']);
                   elementEnd();
                   container(3);
                   lastEl = elementStart(4, 'span', null, ['foo', '']);
                   elementEnd();
                 }
                 if (rf & RenderFlags.Update) {
                   containerRefreshStart(3);
                   {
                     if (ctx.exp) {
                       let rf1 = embeddedViewStart(1);
                       {
                         if (rf1 & RenderFlags.Create) {
                           viewEl = elementStart(0, 'div', null, ['foo', '']);
                           elementEnd();
                         }
                       }
                       embeddedViewEnd();
                     }
                   }
                   containerRefreshEnd();
                 }
               },
               [], [],
               function(rf: RenderFlags, ctx: any) {
                 if (rf & RenderFlags.Create) {
                   query(0, ['foo'], true, QUERY_READ_FROM_NODE);
                 }
                 if (rf & RenderFlags.Update) {
                   let tmp: any;
                   queryRefresh(tmp = load<QueryList<any>>(0)) &&
                       (ctx.query = tmp as QueryList<any>);
                 }
               });

           const cmptInstance = renderComponent(Cmpt);
           const qList = (cmptInstance.query as any);
           expect(qList.length).toBe(2);
           expect(qList.first.nativeElement).toBe(firstEl);
           expect(qList.last.nativeElement).toBe(lastEl);

           cmptInstance.exp = true;
           detectChanges(cmptInstance);
           expect(qList.length).toBe(3);
           expect(qList.toArray()[0].nativeElement).toBe(firstEl);
           expect(qList.toArray()[1].nativeElement).toBe(viewEl);
           expect(qList.toArray()[2].nativeElement).toBe(lastEl);

           cmptInstance.exp = false;
           detectChanges(cmptInstance);
           expect(qList.length).toBe(2);
           expect(qList.first.nativeElement).toBe(firstEl);
           expect(qList.last.nativeElement).toBe(lastEl);
         });

      it('should add results from embedded views in the correct order - views side by side', () => {
        let firstEl, lastEl;
        /**
         * % if (exp1) {
         *    <div #foo></div>
         * % } if (exp2) {
         *    <span #foo></span>
         * % }
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(1);
              }
              if (rf & RenderFlags.Update) {
                containerRefreshStart(1);
                {
                  if (ctx.exp1) {
                    let rf0 = embeddedViewStart(0);
                    {
                      if (rf0 & RenderFlags.Create) {
                        firstEl = elementStart(0, 'div', null, ['foo', '']);
                        elementEnd();
                      }
                    }
                    embeddedViewEnd();
                  }
                  if (ctx.exp2) {
                    let rf1 = embeddedViewStart(1);
                    {
                      if (rf1 & RenderFlags.Create) {
                        lastEl = elementStart(0, 'span', null, ['foo', '']);
                        elementEnd();
                      }
                    }
                    embeddedViewEnd();
                  }
                }
                containerRefreshEnd();
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as any);
        expect(qList.length).toBe(0);

        cmptInstance.exp2 = true;
        detectChanges(cmptInstance);
        expect(qList.length).toBe(1);
        expect(qList.last.nativeElement).toBe(lastEl);

        cmptInstance.exp1 = true;
        detectChanges(cmptInstance);
        expect(qList.length).toBe(2);
        expect(qList.first.nativeElement).toBe(firstEl);
        expect(qList.last.nativeElement).toBe(lastEl);
      });

      it('should add results from embedded views in the correct order - nested views', () => {
        let firstEl, lastEl;
        /**
         * % if (exp1) {
         *    <div #foo></div>
         *    % if (exp2) {
         *      <span #foo></span>
         *    }
         * % }
         * class Cmpt {
         *  @ViewChildren('foo') query;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(1);
              }
              if (rf & RenderFlags.Update) {
                containerRefreshStart(1);
                {
                  if (ctx.exp1) {
                    let rf0 = embeddedViewStart(0);
                    {
                      if (rf0 & RenderFlags.Create) {
                        firstEl = elementStart(0, 'div', null, ['foo', '']);
                        elementEnd();
                        container(2);
                      }
                      if (rf0 & RenderFlags.Update) {
                        containerRefreshStart(2);
                        {
                          if (ctx.exp2) {
                            let rf2 = embeddedViewStart(0);
                            {
                              if (rf2) {
                                lastEl = elementStart(0, 'span', null, ['foo', '']);
                                elementEnd();
                              }
                            }
                            embeddedViewEnd();
                          }
                        }
                        containerRefreshEnd();
                      }
                    }
                    embeddedViewEnd();
                  }
                }
                containerRefreshEnd();
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.query = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const qList = (cmptInstance.query as any);
        expect(qList.length).toBe(0);

        cmptInstance.exp1 = true;
        detectChanges(cmptInstance);
        expect(qList.length).toBe(1);
        expect(qList.first.nativeElement).toBe(firstEl);

        cmptInstance.exp2 = true;
        detectChanges(cmptInstance);
        expect(qList.length).toBe(2);
        expect(qList.first.nativeElement).toBe(firstEl);
        expect(qList.last.nativeElement).toBe(lastEl);
      });

      /**
       * What is tested here can't be achieved in the Renderer2 as all view queries are deep by
       * default and can't be marked as shallow by a user.
       */
      it('should support combination of deep and shallow queries', () => {
        /**
         * % if (exp) { ">
         *    <div #foo></div>
         * % }
         * <span #foo></span>
         * class Cmpt {
         *  @ViewChildren('foo') deep;
         *  @ViewChildren('foo') shallow;
         * }
         */
        const Cmpt = createComponent(
            'cmpt',
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                container(2);
                elementStart(3, 'span', null, ['foo', '']);
                elementEnd();
              }
              if (rf & RenderFlags.Update) {
                containerRefreshStart(2);
                {
                  if (ctx.exp) {
                    let rf0 = embeddedViewStart(0);
                    {
                      if (rf0 & RenderFlags.Create) {
                        elementStart(0, 'div', null, ['foo', '']);
                        elementEnd();
                      }
                    }
                    embeddedViewEnd();
                  }
                }
                containerRefreshEnd();
              }
            },
            [], [],
            function(rf: RenderFlags, ctx: any) {
              if (rf & RenderFlags.Create) {
                query(0, ['foo'], true, QUERY_READ_FROM_NODE);
                query(1, ['foo'], false, QUERY_READ_FROM_NODE);
              }
              if (rf & RenderFlags.Update) {
                let tmp: any;
                queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.deep = tmp as QueryList<any>);
                queryRefresh(tmp = load<QueryList<any>>(1)) &&
                    (ctx.shallow = tmp as QueryList<any>);
              }
            });

        const cmptInstance = renderComponent(Cmpt);
        const deep = (cmptInstance.deep as any);
        const shallow = (cmptInstance.shallow as any);
        expect(deep.length).toBe(1);
        expect(shallow.length).toBe(1);


        cmptInstance.exp = true;
        detectChanges(cmptInstance);
        expect(deep.length).toBe(2);
        expect(shallow.length).toBe(1);

        cmptInstance.exp = false;
        detectChanges(cmptInstance);
        expect(deep.length).toBe(1);
        expect(shallow.length).toBe(1);
      });

    });

  });

  describe('observable interface', () => {

    it('should allow observing changes to query list', () => {
      const queryList = new QueryList();
      let changes = 0;

      queryList.changes.subscribe({
        next: (arg) => {
          changes += 1;
          expect(arg).toBe(queryList);
        }
      });

      // initial refresh, the query should be dirty
      queryRefresh(queryList);
      expect(changes).toBe(1);


      // refresh without setting dirty - no emit
      queryRefresh(queryList);
      expect(changes).toBe(1);

      // refresh with setting dirty - emit
      queryList.setDirty();
      queryRefresh(queryList);
      expect(changes).toBe(2);
    });

  });

  describe('queryList', () => {
    it('should be destroyed when the containing view is destroyed', () => {
      let queryInstance: QueryList<any>;

      const SimpleComponentWithQuery = createComponent(
          'some-component-with-query',
          function(rf: RenderFlags, ctx: any) {
            if (rf & RenderFlags.Create) {
              elementStart(1, 'div', null, ['foo', '']);
              elementEnd();
            }
          },
          [], [],
          function(rf: RenderFlags, ctx: any) {
            if (rf & RenderFlags.Create) {
              query(0, ['foo'], false, QUERY_READ_FROM_NODE);
            }
            if (rf & RenderFlags.Update) {
              let tmp: any;
              queryRefresh(tmp = load<QueryList<any>>(0)) &&
                  (ctx.query = queryInstance = tmp as QueryList<any>);
            }
          });

      function createTemplate() { container(0); }

      function updateTemplate() {
        containerRefreshStart(0);
        {
          if (condition) {
            let rf1 = embeddedViewStart(1);
            {
              if (rf1 & RenderFlags.Create) {
                elementStart(0, 'some-component-with-query');
                elementEnd();
              }
            }
            embeddedViewEnd();
          }
        }
        containerRefreshEnd();
      }

      /**
       * % if (condition) {
       *   <some-component-with-query></some-component-with-query>
       * %}
       */
      let condition = true;
      const t = new TemplateFixture(createTemplate, updateTemplate, [SimpleComponentWithQuery]);
      expect(t.html).toEqual('<some-component-with-query><div></div></some-component-with-query>');
      expect((queryInstance !.changes as EventEmitter<any>).closed).toBeFalsy();

      condition = false;
      t.update();
      expect(t.html).toEqual('');
      expect((queryInstance !.changes as EventEmitter<any>).closed).toBeTruthy();
    });
  });

  describe('content', () => {

    it('should support content queries for directives', () => {
      let withContentInstance: WithContentDirective;

      class WithContentDirective {
        // @ContentChildren('foo') foos;
        // TODO(issue/24571): remove '!'.
        foos !: QueryList<ElementRef>;

        static ngComponentDef = defineDirective({
          type: WithContentDirective,
          selectors: [['', 'with-content', '']],
          factory: () => new WithContentDirective(),
          contentQueries:
              () => { registerContentQuery(query(null, ['foo'], true, QUERY_READ_FROM_NODE)); },
          contentQueriesRefresh: (dirIndex: number, queryStartIdx: number) => {
            let tmp: any;
            withContentInstance = loadDirective<WithContentDirective>(dirIndex);
            queryRefresh(tmp = loadQueryList<ElementRef>(queryStartIdx)) &&
                (withContentInstance.foos = tmp);
          }
        });
      }

      /**
       * <div with-content>
       *   <span #foo></span>
       * </div>
       * class Cmpt {
       * }
       */
      const AppComponent = createComponent('app-component', function(rf: RenderFlags, ctx: any) {
        if (rf & RenderFlags.Create) {
          elementStart(0, 'div', [AttributeMarker.SelectOnly, 'with-content']);
          { element(1, 'span', null, ['foo', '']); }
          elementEnd();
        }
      }, [WithContentDirective]);

      const fixture = new ComponentFixture(AppComponent);
      expect(withContentInstance !.foos.length).toBe(1);
    });

    // https://stackblitz.com/edit/angular-wlenwd?file=src%2Fapp%2Fapp.component.ts
    it('should support view and content queries matching the same element', () => {
      let withContentComponentInstance: WithContentComponent;

      class WithContentComponent {
        // @ContentChildren('foo') foos;
        // TODO(issue/24571): remove '!'.
        foos !: QueryList<ElementRef>;

        static ngComponentDef = defineComponent({
          type: WithContentComponent,
          selectors: [['with-content']],
          factory: () => new WithContentComponent(),
          contentQueries:
              () => { registerContentQuery(query(null, ['foo'], true, QUERY_READ_FROM_NODE)); },
          template: (rf: RenderFlags, ctx: WithContentComponent) => {
            // intentionally left empty, don't need anything for this test
          },
          contentQueriesRefresh: (dirIndex: number, queryStartIdx: number) => {
            let tmp: any;
            withContentComponentInstance = loadDirective<WithContentComponent>(dirIndex);
            queryRefresh(tmp = loadQueryList<ElementRef>(queryStartIdx)) &&
                (withContentComponentInstance.foos = tmp);
          },
        });
      }

      /**
       * <with-content>
       *   <div #foo></div>
       * </with-content>
       * <div id="after" #bar></div>
       * class Cmpt {
       *  @ViewChildren('foo, bar') foos;
       * }
       */
      const AppComponent = createComponent(
          'app-component',
          function(rf: RenderFlags, ctx: any) {
            if (rf & RenderFlags.Create) {
              elementStart(1, 'with-content');
              { element(2, 'div', null, ['foo', '']); }
              elementEnd();
              element(4, 'div', ['id', 'after'], ['bar', '']);
            }
          },
          [WithContentComponent], [],
          function(rf: RenderFlags, ctx: any) {
            if (rf & RenderFlags.Create) {
              query(0, ['foo', 'bar'], true, QUERY_READ_FROM_NODE);
            }
            if (rf & RenderFlags.Update) {
              let tmp: any;
              queryRefresh(tmp = load<QueryList<any>>(0)) && (ctx.foos = tmp as QueryList<any>);
            }
          });

      const fixture = new ComponentFixture(AppComponent);
      const viewQList = fixture.component.foos;

      expect(viewQList.length).toBe(2);
      expect(withContentComponentInstance !.foos.length).toBe(1);
      expect(viewQList.first.nativeElement)
          .toBe(withContentComponentInstance !.foos.first.nativeElement);
      expect(viewQList.last.nativeElement.id).toBe('after');
    });

    it('should report results to appropriate queries where content queries are nested', () => {

      class QueryDirective {
        fooBars: any;
        static ngDirectiveDef = defineDirective({
          type: QueryDirective,
          selectors: [['', 'query', '']],
          exportAs: 'query',
          factory: () => new QueryDirective(),
          contentQueries: () => {
            // @ContentChildren('foo, bar, baz', {descendants: true}) fooBars:
            // QueryList<ElementRef>;
            registerContentQuery(query(null, ['foo', 'bar', 'baz'], true, QUERY_READ_FROM_NODE));
          },
          contentQueriesRefresh: (dirIndex: number, queryStartIdx: number) => {
            let tmp: any;
            const instance = loadDirective<QueryDirective>(dirIndex);
            queryRefresh(tmp = loadQueryList<ElementRef>(queryStartIdx)) &&
                (instance.fooBars = tmp);
          },
        });
      }

      let outInstance: QueryDirective;
      let inInstance: QueryDirective;

      const AppComponent = createComponent(
          'app-component',
          /**
           * <div query #out="query">
           *   <span #foo></span>
           *   <div query #in="query">
           *     <span #bar></span>
           *   </div>
           *   <span #baz></span>
           * </div>
           */
          function(rf: RenderFlags, ctx: any) {
            if (rf & RenderFlags.Create) {
              elementStart(0, 'div', [AttributeMarker.SelectOnly, 'query'], ['out', 'query']);
              {
                element(2, 'span', ['id', 'foo'], ['foo', '']);
                elementStart(4, 'div', [AttributeMarker.SelectOnly, 'query'], ['in', 'query']);
                { element(6, 'span', ['id', 'bar'], ['bar', '']); }
                elementEnd();
                element(8, 'span', ['id', 'baz'], ['baz', '']);
              }
              elementEnd();
            }
            if (rf & RenderFlags.Update) {
              outInstance = load<QueryDirective>(1);
              inInstance = load<QueryDirective>(5);
            }
          },
          [QueryDirective]);

      const fixture = new ComponentFixture(AppComponent);
      expect(outInstance !.fooBars.length).toBe(3);
      expect(inInstance !.fooBars.length).toBe(1);
    });

    it('should respect shallow flag on content queries when mixing deep and shallow queries',
       () => {
         class ShallowQueryDirective {
           foos: any;
           static ngDirectiveDef = defineDirective({
             type: ShallowQueryDirective,
             selectors: [['', 'shallow-query', '']],
             exportAs: 'shallow-query',
             factory: () => new ShallowQueryDirective(),
             contentQueries: () => {
               // @ContentChildren('foo', {descendants: false}) foos: QueryList<ElementRef>;
               registerContentQuery(query(null, ['foo'], false, QUERY_READ_FROM_NODE));
             },
             contentQueriesRefresh: (dirIndex: number, queryStartIdx: number) => {
               let tmp: any;
               const instance = loadDirective<ShallowQueryDirective>(dirIndex);
               queryRefresh(tmp = loadQueryList<ElementRef>(queryStartIdx)) &&
                   (instance.foos = tmp);
             },
           });
         }

         class DeepQueryDirective {
           foos: any;
           static ngDirectiveDef = defineDirective({
             type: DeepQueryDirective,
             selectors: [['', 'deep-query', '']],
             exportAs: 'deep-query',
             factory: () => new DeepQueryDirective(),
             contentQueries: () => {
               // @ContentChildren('foo', {descendants: false}) foos: QueryList<ElementRef>;
               registerContentQuery(query(null, ['foo'], true, QUERY_READ_FROM_NODE));
             },
             contentQueriesRefresh: (dirIndex: number, queryStartIdx: number) => {
               let tmp: any;
               const instance = loadDirective<DeepQueryDirective>(dirIndex);
               queryRefresh(tmp = loadQueryList<ElementRef>(queryStartIdx)) &&
                   (instance.foos = tmp);
             },
           });
         }

         let shallowInstance: ShallowQueryDirective;
         let deepInstance: DeepQueryDirective;

         const AppComponent = createComponent(
             'app-component',
             /**
              * <div shallow-query #shallow="shallow-query" deep-query #deep="deep-query">
               *   <span #foo></span>
              * </div>
              */
             function(rf: RenderFlags, ctx: any) {
               if (rf & RenderFlags.Create) {
                 elementStart(
                     0, 'div', [AttributeMarker.SelectOnly, 'shallow-query', 'deep-query'],
                     ['shallow', 'shallow-query', 'deep', 'deep-query']);
                 { element(3, 'span', ['id', 'foo'], ['foo', '']); }
                 elementEnd();
               }
               if (rf & RenderFlags.Update) {
                 shallowInstance = load<ShallowQueryDirective>(1);
                 deepInstance = load<DeepQueryDirective>(2);
               }
             },
             [ShallowQueryDirective, DeepQueryDirective]);

         const fixture = new ComponentFixture(AppComponent);
         expect(shallowInstance !.foos.length).toBe(1);
         expect(deepInstance !.foos.length).toBe(1);
       });
  });
});
