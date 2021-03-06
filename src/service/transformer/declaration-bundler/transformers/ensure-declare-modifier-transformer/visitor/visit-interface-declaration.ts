import {TS} from "../../../../../../type/ts";
import {EnsureDeclareModifierTransformerVisitorOptions} from "../ensure-declare-modifier-transformer-visitor-options";
import {preserveMeta} from "../../../util/clone-node-with-meta";
import {hasDeclareModifier, removeDeclareModifier} from "../../../util/modifier-util";

export function visitInterfaceDeclaration(options: EnsureDeclareModifierTransformerVisitorOptions<TS.InterfaceDeclaration>): TS.InterfaceDeclaration {
	const {node, compatFactory, typescript} = options;
	if (!hasDeclareModifier(node, typescript)) return node;

	return preserveMeta(
		compatFactory.updateInterfaceDeclaration(
			node,
			node.decorators,
			removeDeclareModifier(node.modifiers, typescript),
			node.name,
			node.typeParameters,
			node.heritageClauses,
			node.members
		),
		node,
		options
	);
}
