import { File } from 'rxline/fs';
import { PartialOptions as MarkdownOptions, quotedComponents } from '@connectv/marked';
import { TransportedFunc } from '@connectv/sdh/dist/es6/dynamic/transport/index';

import { CodedocTheme, ThemeExtension, DefaultTheme, createTheme } from './theme';
import { guessTitle } from './util/guess-title';

import { Code } from './components/code';
import { Heading } from './components/heading';
import { Button, CopyButton, Buttons } from './components/button';
import { Tab, Tabs } from './components/tabs';
import { DarkLight, InLight, InDark } from './components/darkmode/darklight';
import { GithubButton } from './components/misc/github';
import { Watermark } from './components/misc/watermark';
import { codeSelection$ } from './components/code/selection';
import { sameLineLengthInCodes$ } from './components/code/same-line-length';
import { codeLineHints$ } from './components/code/line-hint';
import { codeLineRef$ } from './components/code/line-ref';
import { smartCopy$ } from './components/code/smart-copy';
import { copyHeadings$ } from './components/heading/copy-headings';
import { contentNavHighlight$ } from './components/page/contentnav/highlight';
import { deferredIframes$ } from './util/deferred-iframe';


export interface SourceConfig {
  base: string;
  toc: string;
  notfound: string;
  pick: RegExp;
  drop: RegExp;
}


export interface DestConfig {
  html: string;
  bundle: string;
}


export interface BundleConfig {
  baseUrl: string;
  init: TransportedFunc<void>[],
}


export interface TitleConfig {
  base: string;
  connector: string;
  extractor: (content: HTMLElement, config: CodedocConfig, file: File<string>) => string;
}


export interface GithubConfig {
  user: string;
  repo: string;
}


export interface CodedocConfig {
  src: SourceConfig;
  dest: DestConfig;
  bundle: BundleConfig;
  title: TitleConfig;
  theme: CodedocTheme;
  markdown: MarkdownOptions<any, any>;
  misc?: {
    github?: GithubConfig;
    [whatever: string]: any;
  }
}


export const DefaultConfig: CodedocConfig = {
  src: {
    base: 'docs/md',
    toc: '_toc.md',
    notfound: '_404.md',
    pick: /\.md$/,
    drop: /(^_)|(\/_)/,
  },

  dest: {
    html: '.',
    bundle: 'docs/assets',
  },

  bundle: {
    baseUrl: 'docs/assets',
    init: [
      codeSelection$, sameLineLengthInCodes$, codeLineHints$, codeLineRef$, smartCopy$,
      copyHeadings$, contentNavHighlight$, deferredIframes$,
    ],
  },

  title: {
    base: 'New Codedoc Project',
    connector: ' | ',
    extractor: (content, config) => guessTitle(content, config.title.base, config.title.connector),
  },

  theme: DefaultTheme,
  markdown: {
    Code,
    Heading,
    BlockQuote: quotedComponents({
      Tab, Tabs,
      Button, Buttons, CopyButton,
      DarkLight, InDark, InLight,
      GithubButton, Watermark,
    })
  }
}


export interface ConfigOverride {
  src?: Partial<SourceConfig>;
  dest?: Partial<DestConfig>;
  bundle?: Partial<BundleConfig>;
  title?: Partial<TitleConfig>;
  theme?: ThemeExtension;
  markdown?: MarkdownOptions<any, any>;
  misc?: {
    github?: GithubConfig;
    [whatevs: string]: any;
  }
}


export function configuration(override: ConfigOverride): CodedocConfig {
  const res = { ...DefaultConfig };

  if (override.src) Object.assign(res.src, override.src);
  if (override.dest) Object.assign(res.dest, override.dest);
  if (override.bundle) Object.assign(res.bundle, override.bundle);
  if (override.title) Object.assign(res.title, override.title);
  if (override.theme) res.theme = createTheme(override.theme);
  if (override.markdown) Object.assign(res.markdown, override.markdown);

  if (override.misc) res.misc = override.misc;

  return res;
}
