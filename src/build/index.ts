import chalk from 'chalk';
import { join } from 'path';
import { Configuration } from 'webpack';
import { files, pathMatch, readFile, mapExt, mapRoot, File, mapContent } from 'rxline/fs';
import { post, save, Compiled } from '@connectv/sdh';
import { TransportedFunc } from '@connectv/sdh/dist/es6/dynamic/transport/index';

import { CodedocConfig } from '../config';
import { initJss } from '../transport/setup-jss';
import { bundle } from './bundle';
import { ContentBuilder } from './types';
import { content } from './content';
import { styles } from './styles';
import { loadToC } from './toc';
import { namespace } from './namespace';
import { pageSpecificMeta } from '../components/page/meta-override/post';


export async function build(
  config: CodedocConfig,
  builder: ContentBuilder,
  themeInstaller: TransportedFunc<void>,
  webpackConfig?: Configuration,
) {
  initJss();

  const _bundle = bundle(config, themeInstaller);
  const _styles = styles(config);

  const _toc = await loadToC(config);

  return new Promise(resolve => {
    files('.', { root: config.src.base })
      .pick(pathMatch(config.src.pick))
      .drop(pathMatch(config.src.drop))
      .peek(file => console.log(`${chalk.gray('# building ........ ' + join(file.root, file.path)) }`))
      .pipe(
        readFile(),
        content(builder, _toc, config, _styles),
        post(_bundle.collect()),
        post(namespace(config)),
        post(pageSpecificMeta),
        (file: File<Compiled>) => {
          (config.page.post || []).forEach(p => file.content.post(html => p(html, file, config)));
          return file;
        },
        mapExt(() => '.html'),
        mapRoot(() => config.dest.html),
        save(),
      )
      .peek(file => console.log(`${chalk.green('#')}${chalk.gray(' built:: .........')} ${join(file.root, file.path)}`))
      .process()
      .collect(async () => {
        console.log(`${chalk.gray('# building ........ ' + _styles.path)}`);
        await _styles.save();
        console.log(`${chalk.green('#')} ${chalk.gray('built:: .........')} ${_styles.path}`)

        console.log(`${chalk.gray('# building ........ ' + _bundle.path)}`);
        await save(_bundle, webpackConfig);
        console.log(`${chalk.green('#')} ${chalk.gray('built:: .........')} ${_bundle.path}`);

        resolve();
      });
  });
}
