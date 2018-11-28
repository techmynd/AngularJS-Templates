/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 *
 * @fileoverview Bazel bundle builder
 */

import {BuildEvent, Builder as BuilderInterface, BuilderConfiguration, BuilderContext} from '@angular-devkit/architect';
import {getSystemPath, resolve} from '@angular-devkit/core';
import {Observable, of } from 'rxjs';
import {catchError, map, tap} from 'rxjs/operators';

import {checkInstallation, runBazel} from './bazel';
import {Schema} from './schema';

export class Builder implements BuilderInterface<Schema> {
  constructor(private context: BuilderContext) {}

  run(builderConfig: BuilderConfiguration<Partial<Schema>>): Observable<BuildEvent> {
    const projectRoot = getSystemPath(resolve(this.context.workspace.root, builderConfig.root));
    const targetLabel = builderConfig.options.targetLabel;

    const executable = builderConfig.options.watch ? 'ibazel' : 'bazel';

    if (!checkInstallation(executable, projectRoot)) {
      throw new Error(
          `Could not run ${executable}. Please make sure that the ` +
          `"${executable}" command is available in the $PATH.`);
    }

    // TODO: Support passing flags.
    return runBazel(
               projectRoot, executable, builderConfig.options.bazelCommand !, targetLabel !,
               [] /* flags */)
        .pipe(map(() => ({success: true})), catchError(() => of ({success: false})), );
  }
}
