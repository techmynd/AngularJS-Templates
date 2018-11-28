/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Type} from '../../type';
import {ComponentDefInternal, ComponentType, DirectiveDefFeature, DirectiveDefInternal} from '../interfaces/definition';


/**
 * Sets properties on a target object from a source object, but only if
 * the property doesn't already exist on the target object.
 * @param target The target to set properties on
 * @param source The source of the property keys and values to set
 */
function fillProperties(target: {[key: string]: string}, source: {[key: string]: string}) {
  for (const key in source) {
    if (source.hasOwnProperty(key) && !target.hasOwnProperty(key)) {
      target[key] = source[key];
    }
  }
}
/**
 * Determines if a definition is a {@link ComponentDefInternal} or a {@link DirectiveDefInternal}
 * @param definition The definition to examine
 */
function isComponentDef<T>(definition: ComponentDefInternal<T>| DirectiveDefInternal<T>):
    definition is ComponentDefInternal<T> {
  const def = definition as ComponentDefInternal<T>;
  return typeof def.template === 'function';
}

function getSuperType(type: Type<any>): Type<any>&
    {ngComponentDef?: ComponentDefInternal<any>, ngDirectiveDef?: DirectiveDefInternal<any>} {
  return Object.getPrototypeOf(type.prototype).constructor;
}

/**
 * Merges the definition from a super class to a sub class.
 * @param definition The definition that is a SubClass of another directive of component
 */
export function InheritDefinitionFeature(
    definition: DirectiveDefInternal<any>| ComponentDefInternal<any>): void {
  let superType = getSuperType(definition.type);
  let superDef: DirectiveDefInternal<any>|ComponentDefInternal<any>|undefined = undefined;

  while (superType && !superDef) {
    if (isComponentDef(definition)) {
      superDef = superType.ngComponentDef || superType.ngDirectiveDef;
    } else {
      if (superType.ngComponentDef) {
        throw new Error('Directives cannot inherit Components');
      }
      superDef = superType.ngDirectiveDef;
    }

    if (superDef) {
      // Merge inputs and outputs
      fillProperties(definition.inputs, superDef.inputs);
      fillProperties(definition.declaredInputs, superDef.declaredInputs);
      fillProperties(definition.outputs, superDef.outputs);

      // Merge hostBindings
      const prevHostBindings = definition.hostBindings;
      const superHostBindings = superDef.hostBindings;
      if (superHostBindings) {
        if (prevHostBindings) {
          definition.hostBindings = (directiveIndex: number, elementIndex: number) => {
            superHostBindings(directiveIndex, elementIndex);
            prevHostBindings(directiveIndex, elementIndex);
          };
        } else {
          definition.hostBindings = superHostBindings;
        }
      }

      // Inherit hooks
      // Assume super class inheritance feature has already run.
      definition.afterContentChecked =
          definition.afterContentChecked || superDef.afterContentChecked;
      definition.afterContentInit = definition.afterContentInit || superDef.afterContentInit;
      definition.afterViewChecked = definition.afterViewChecked || superDef.afterViewChecked;
      definition.afterViewInit = definition.afterViewInit || superDef.afterViewInit;
      definition.doCheck = definition.doCheck || superDef.doCheck;
      definition.onDestroy = definition.onDestroy || superDef.onDestroy;
      definition.onInit = definition.onInit || superDef.onInit;

      // Run parent features
      const features = superDef.features;
      if (features) {
        for (const feature of features) {
          if (feature && feature !== InheritDefinitionFeature) {
            (feature as DirectiveDefFeature)(definition);
          }
        }
      }
    } else {
      // Even if we don't have a definition, check the type for the hooks and use those if need be
      const superPrototype = superType.prototype;

      if (superPrototype) {
        definition.afterContentChecked =
            definition.afterContentChecked || superPrototype.afterContentChecked;
        definition.afterContentInit =
            definition.afterContentInit || superPrototype.afterContentInit;
        definition.afterViewChecked =
            definition.afterViewChecked || superPrototype.afterViewChecked;
        definition.afterViewInit = definition.afterViewInit || superPrototype.afterViewInit;
        definition.doCheck = definition.doCheck || superPrototype.doCheck;
        definition.onDestroy = definition.onDestroy || superPrototype.onDestroy;
        definition.onInit = definition.onInit || superPrototype.onInit;
      }
    }

    superType = Object.getPrototypeOf(superType);
  }
}
