import test from "./util/test-runner";
import {formatCode} from "./util/format-code";
import {generateRollupBundle} from "./setup/setup-rollup";

test("Tree-shakes correctly. #1", async (t, {typescript, typescriptModuleSpecifier}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					import {SyntaxKind, EmitHint} from "${typescriptModuleSpecifier}";
					export type Baz = SyntaxKind;
					`
			}
		],
		{
			typescript,
			debug: false
		}
	);
	const {
		declarations: [file]
	} = bundle;
	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		import {SyntaxKind} from "${typescriptModuleSpecifier}";
		type Baz = SyntaxKind;
		export {Baz};
		`)
	);
});

test("Tree-shakes correctly. #2", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					export {bar} from "./foo";
					`
			},
			{
				entry: false,
				fileName: "foo.ts",
				text: `\
					export const foo = 2;
					export const bar = 3;
					`
			}
		],
		{
			typescript,
			debug: false
		}
	);
	const {
		declarations: [file]
	} = bundle;
	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		declare const bar = 3;
		export {bar};
		`)
	);
});

test("Tree-shakes correctly. #3", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					export {Foo} from "./foo";
					`
			},
			{
				entry: false,
				fileName: "foo.ts",
				text: `\
					import {Bar} from "./bar";
					export interface Foo {
						bar: Bar;
					}
					`
			},
			{
				entry: false,
				fileName: "bar.ts",
				text: `\
					import {Foo} from "./foo";
					export class Bar {
						bar: Foo;
					}
					`
			}
		],
		{
			typescript,
			debug: false
		}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
			declare class Bar {
				bar: Foo;
			}
			interface Foo {
				bar: Bar;
			}
			export { Foo };
		`)
	);
});

test("Tree-shakes correctly. #4", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					type A = string;
					type B = number;
					type C = symbol;
					export interface Foo {
						a: A;
						b: B;
					}
					`
			}
		],
		{
			typescript,
			debug: false
		}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
			type A = string;
			type B = number;
			interface Foo {
				a: A;
				b: B;
			}
			export {Foo};
		`)
	);
});

test("Tree-shakes correctly. #5", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					type A = string;
					export function foo<A> (arg: A): void {}
					`
			}
		],
		{
			typescript,
			debug: false
		}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
			declare function foo<A> (arg: A): void;
			export {foo};
		`)
	);
});

test("Tree-shakes correctly. #6", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					declare global {
							interface Window {
									foo: string:
							}
					}`
			}
		],
		{
			typescript,
			debug: false,
			transpileOnly: true
		}
	);
	const {
		declarations: [file]
	} = bundle;
	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		declare global {
				interface Window {
						foo: string;
				}
		}
		export {};
		`)
	);
});

test("Tree-shakes correctly. #7", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					const S = Symbol();

					export const f2 = {
						[S]: "";
					}
				`
			}
		],
		{
			typescript,
			debug: false
		}
	);
	const {
		declarations: [file]
	} = bundle;
	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		declare const S: unique symbol;
		declare const f2: {
				[S]: string;
		};
		export { f2 };
		`)
	);
});

test("Tree-shakes correctly. #8", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
				const S = Symbol();
				export default {
					async [S] () {
						return;
					}
				}
				`
			}
		],
		{
			typescript,
			debug: false
		}
	);
	const {
		declarations: [file]
	} = bundle;
	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		declare const S: unique symbol;
		declare const _default: {
    	[S](): Promise<void>;
		};
		export { _default as default };
		`)
	);
});
