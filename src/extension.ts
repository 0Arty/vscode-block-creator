import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Component Generator is now active!')
	const disposable = vscode.commands.registerCommand('component-generator.create', async () => {
		const type = await vscode.window.showQuickPick(['feature', 'layout', 'ui'], {
			placeHolder: 'Select component type'
		});
		if (!type) return;

		const name = await vscode.window.showInputBox({
			prompt: 'Enter component name (without extension)',
			validateInput: text => text ? null : 'Name cannot be empty'
		});
		if (!name) return;

		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folder open');
			return;
		}
		const root = workspaceFolders[0].uri.fsPath;

		const componentPath = path.join(root, 'src', 'app', 'components', type, `${name}.tsx`);
		const stylePath = path.join(root, 'src', 'styles', 'components', type, `${name}.scss`);

		fs.mkdirSync(path.dirname(componentPath), { recursive: true });
		fs.mkdirSync(path.dirname(stylePath), { recursive: true });

		fs.writeFileSync(componentPath, `import './${name}.scss';\n\nexport const ${capitalize(name)} = () => {\n  return <div className="${name}">${name}</div>;\n};\n`);
		fs.writeFileSync(stylePath, `.${name} {\n  // styles\n}\n`);

		vscode.window.showInformationMessage(`Component "${name}" created in "${type}"`);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}

function capitalize(str: string) {
	return str.charAt(0).toUpperCase() + str.slice(1);
}
