import test from "./util/test-runner";
import {formatCode} from "./util/format-code";
import {generateRollupBundle} from "./setup/setup-rollup";
import {lt} from "semver";

test("Flattens declarations. #1", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					import {Bar} from "./bar";
					export interface Foo extends Bar {}
					`
			},
			{
				entry: false,
				fileName: "bar.ts",
				text: `\
					export interface Bar {
						a: string;
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
		interface Bar {
			a: string;
		}
		interface Foo extends Bar {}
		export {Foo};
		`)
	);
});

test("Flattens declarations. #2", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					export * from "./bar";
					`
			},
			{
				entry: false,
				fileName: "bar.ts",
				text: `\
					export interface Foo {}
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
		interface Foo {}
		export {Foo};
		`)
	);
});

test("Flattens declarations. #3", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					export * from "./bar";
					`
			},
			{
				entry: false,
				fileName: "bar.ts",
				text: `\
					export * from "./baz";
					`
			},
			{
				entry: false,
				fileName: "baz.ts",
				text: `\
					export interface Foo {}
					`
			}
		],
		{typescript, debug: false}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		interface Foo {}
		export {Foo};
		`)
	);
});

test("Flattens declarations. #4", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					export * from "./bar";
					`
			},
			{
				entry: false,
				fileName: "bar.ts",
				text: `\
					export * from "./a";
					export * from "./b";
					`
			},
			{
				entry: false,
				fileName: "a.ts",
				text: `\
					export type Something =
					| "foo"
					| "bar";
					`
			},
			{
				entry: false,
				fileName: "b.ts",
				text: `\
					export const enum SomethingElse {
						FOO = 0,
						BAR = 1
					}
					`
			}
		],
		{typescript, debug: false}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		type Something = "foo" | "bar";
		declare const enum SomethingElse {
			FOO = 0,
			BAR = 1
		}
		export {Something, SomethingElse};
		`)
	);
});

test("Flattens declarations. #5", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					import * as m from "./bar";
					export { m };
					`
			},
			{
				entry: false,
				fileName: "bar.ts",
				text: `\
					export const ten = 10;
					`
			}
		],
		{typescript, debug: false}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		declare namespace m {
    	const ten = 10;
		}
		export { m };
		`)
	);
});

test("Flattens declarations. #6", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
          		export * from "./foo";
        	`
			},
			{
				entry: false,
				fileName: "foo/index.ts",
				text: `\
				export const Foo = "foo";
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
			declare const Foo = "foo";
			export {Foo};
		`)
	);
});

test("Flattens declarations. #7", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
          		export * from "./foo.baz";
          		export * from "./bar.baz";
        	`
			},
			{
				entry: false,
				fileName: "foo.baz.ts",
				text: `\
				export const Foo = "foo";
				`
			},
			{
				entry: false,
				fileName: "bar.baz.ts",
				text: `\
				export const Bar = "bar";
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
			declare const Foo = "foo";
			declare const Bar = "bar";
			export {Foo, Bar};
		`)
	);
});

test("Flattens declarations. #8", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
							import {Foo} from "./foo";
          		export const foo: Foo = 2;
        	`
			},
			{
				entry: false,
				fileName: "foo.ts",
				text: `\
				export type Foo = number;
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
			type Foo = number;
			declare const foo: Foo;
			export {foo};
		`)
	);
});

test("Flattens declarations. #9", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
        import * as bar from './bar';
        export type FooType = bar.BarType;
			`
			},
			{
				entry: false,
				fileName: "bar.ts",
				text: `\
        export type BarType = 'a' | 'b' | 'c';
			`
			}
		],
		{typescript, debug: false}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
			declare namespace bar {
					type BarType = 'a' | 'b' | 'c';
			}
			type FooType = bar.BarType;
			export { FooType };
		`)
	);
});

test("Flattens declarations. #10", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
        import { Item } from './items';
				export class B {
					items: Item[];
				}
			`
			},
			{
				entry: false,
				fileName: "items/item.ts",
				text: `\
        export interface Item {
					id: string;
				}
			`
			},
			{
				entry: false,
				fileName: "items/index.ts",
				text: `\
        export * from "./item";
			`
			}
		],
		{typescript, debug: false}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
			interface Item {
					id: string;
			}
			declare class B {
					items: Item[];
			}
			export { B };
		`)
	);
});

test("Flattens declarations. #11", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
        import {X} from "./x"
				export const y = new X
			`
			},
			{
				entry: false,
				fileName: "x.ts",
				text: `\
        declare class X {}
				export {X}
			`
			}
		],
		{
			typescript,
			debug: false,
			rollupOptions: {
				external(id) {
					return /\bx\b/.test(id);
				}
			}
		}
	);
	const {
		declarations: [file]
	} = bundle;

	t.deepEqual(
		formatCode(file.code),
		formatCode(`\
		import { X } from "./x";
		declare const y: X;
		export { y };

		`)
	);
});

test("Flattens declarations. #12", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
        export {Foo} from "./foo"
			`
			},
			{
				entry: false,
				fileName: "foo.ts",
				text: `\
        export class Foo { static m() { return 1 } }
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
			declare class Foo {
				static m(): number;
			}
			export {Foo};
		`)
	);
});

test("Flattens declarations. #13", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
        import { A as AClass } from './a';
				export type A = AClass;
			`
			},
			{
				entry: false,
				fileName: "a.ts",
				text: `\
        export class A {}
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
			declare class A {
			}
			declare module AWrapper {
					export { A };
			}
			import AClass = AWrapper.A;
			type A$0 = AClass;
			export { A$0 as A };
		`)
	);
});

test("Flattens declarations. #14", async (t, {typescript}) => {
	if (lt(typescript.version, "3.5.0")) {
		t.pass(`Current TypeScript version (${typescript.version} does not support the 'Omit' type. Skipping...`);
		return;
	}

	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "virtual-src/components/generated.ts",
				text: `\
        export const WebGLMultisampleRenderTarget = {} as unknown as import("..").Overwrite<Partial<string>, number>;
				console.log(WebGLMultisampleRenderTarget);
			`
			},
			{
				entry: false,
				fileName: "virtual-src/index.ts",
				text: `\
        export type NonFunctionKeys<T> = {
						[K in keyof T]: T[K] extends Function ? never : K;
				}[keyof T];
				export type Overwrite<T, O> = Omit<T, NonFunctionKeys<O>> & O;
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
		type NonFunctionKeys<T> = {
				[K in keyof T]: T[K] extends Function ? never : K;
		}[keyof T];
		type Overwrite<T, O> = Omit<T, NonFunctionKeys<O>> & O;
		declare const WebGLMultisampleRenderTarget: Overwrite<string, number>;
		export { WebGLMultisampleRenderTarget };
		`)
	);
});

test("Flattens declarations. #15", async (t, {typescript}) => {
	if (lt(typescript.version, "3.5.0")) {
		t.pass(`Current TypeScript version (${typescript.version} does not support the 'readonly' keyword in front of arrays (like 'readonly string[]'). Skipping...`);
		return;
	}

	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "virtual-src/components/generated.ts",
				text: `\
        export const WebGLMultisampleRenderTarget = {} as unknown as import("typescript").NodeArray<import("..").Overwrite<Partial<string>, number>>;
				console.log(WebGLMultisampleRenderTarget);
			`
			},
			{
				entry: false,
				fileName: "virtual-src/index.ts",
				text: `\
        export type NonFunctionKeys<T> = {
						[K in keyof T]: T[K] extends Function ? never : K;
				}[keyof T];
				export type Overwrite<T, O> = Omit<T, NonFunctionKeys<O>> & O;
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
		type NonFunctionKeys<T> = {
				[K in keyof T]: T[K] extends Function ? never : K;
		}[keyof T];
		type Overwrite<T, O> = Omit<T, NonFunctionKeys<O>> & O;
		declare const WebGLMultisampleRenderTarget: import("typescript").NodeArray<Overwrite<string, number>>;
		export { WebGLMultisampleRenderTarget };
		`)
	);
});

test("Flattens declarations. #16", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "virtual-src/index.ts",
				text: `\
        export * from './lib-ref';
				export * from './problem-file';
			`
			},
			{
				entry: false,
				fileName: "virtual-src/lib-ref.ts",
				text: `\
        export {
					Foo as F,
					utils,
					emitter
				} from './main-lib';
			`
			},
			{
				entry: false,
				fileName: "virtual-src/problem-file.ts",
				text: `\
        import * as libRef from './lib-ref';

				export interface Problem {
					foo: libRef.F;
					doAThing:(ref:typeof libRef) => void;
				}
			`
			},
			{
				entry: false,
				fileName: "virtual-src/main-lib/index.ts",
				text: `\
				export * from './module-b';
				export * from './utils';
				export * from './module-a';
			`
			},
			{
				entry: false,
				fileName: "virtual-src/main-lib/module-a.ts",
				text: `\
				export class Foo {
					public bar: () => {};
				}
			`
			},
			{
				entry: false,
				fileName: "virtual-src/main-lib/module-b.ts",
				text: `\
				export const emitter = () => {};
			`
			},
			{
				entry: false,
				fileName: "virtual-src/main-lib/utils.ts",
				text: `\
				export namespace utils {
					export function blah() { return "I'm a string!"; }
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
			declare const emitter: () => void;
			declare namespace utils {
					function blah(): string;
			}
			declare class Foo {
					bar: () => {};
			}
			declare namespace libRef {
					const emitter: () => void;
					namespace utils {
							function blah(): string;
					}
					class Foo {
							bar: () => {};
					}
			}
			interface Problem {
					foo: libRef.Foo;
					doAThing: (ref: typeof libRef) => void;
			}
			export { Foo as F, utils, emitter, Problem };
		`)
	);
});

test("Flattens declarations. #17", async (t, {typescript}) => {
	const bundle = await generateRollupBundle(
		[
			{
				entry: true,
				fileName: "index.ts",
				text: `\
					export class Singleton {
						private constructor() {}
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
		declare class Singleton {
			private constructor();
		}
		export {Singleton};
		`)
	);
});
