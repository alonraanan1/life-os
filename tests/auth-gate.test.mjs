import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import ts from 'typescript';

const source=await readFile(new URL('../components/life/auth-gate.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
  .replace(/from ["']([^"']+)["']/g,(_,specifier)=>'from '+JSON.stringify(import.meta.resolve(specifier)));
const {AuthGate}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));

test('the first paint does not show the sign-in card before the session is checked',()=>{
  const html=renderToString(createElement(AuthGate,null,'app'));
  assert.match(html,/מתחבר/);
  assert.doesNotMatch(html,/טוב שחזרת/);
  assert.doesNotMatch(html,/Google/);
});
