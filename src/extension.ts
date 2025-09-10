import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Component Generator is now active!');

    const disposable = vscode.commands.registerCommand('component-generator.create', async () => {
        const type = await vscode.window.showQuickPick(['feature', 'layout', 'ui', 'modals'], {
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

        // === SCSS ===
        const stylePath = path.join(root, 'src', 'styles', type, `${name}.module.scss`);
        fs.mkdirSync(path.dirname(stylePath), { recursive: true });
        fs.writeFileSync(stylePath, `.root {\n  // styles\n}\n`);

        // === Component TSX ===
        const componentName = capitalize(name);
        const componentPath = path.join(root, 'src', 'components', type, `${componentName}.tsx`);
        fs.mkdirSync(path.dirname(componentPath), { recursive: true });

        fs.writeFileSync(componentPath,
`import styles from '@/styles/${type}/${name}.module.scss';

interface I${componentName} {
}

const ${componentName} = ({ }: I${componentName}) => {
    return (
        <div className={styles.root}>

        </div>
    );
};

export default ${componentName};
`)

        // === Component Index.ts ===
        const componentIndexPath = path.join(root, 'src', 'components', type, `index.ts`);
        const exportLine = `export * from './${componentName}';\n`;

        if (!fs.existsSync(componentIndexPath)) {
            fs.writeFileSync(componentIndexPath, exportLine);
        } else {
            const componentIndexContent = fs.readFileSync(componentIndexPath, 'utf-8');
            if (!componentIndexContent.includes(`'./${componentName}'`)) {
                fs.appendFileSync(componentIndexPath, exportLine);
            }
        }

        vscode.window.showInformationMessage(`Component "${componentName}" created in "${type}"`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
