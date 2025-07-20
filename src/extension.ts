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

        //work with scss
        const indexPath = path.join(root, 'src', 'styles', type, `index.ts`);
        const importName = name.toLowerCase();
        const className = `${type}Styles`;
        const stylePath = path.join(root, 'src', 'styles', type, `${name}.module.scss`);

        fs.mkdirSync(path.dirname(stylePath), { recursive: true });
        fs.writeFileSync(stylePath, `.${importName} {\n  // styles\n}\n`);

        // Якщо index.ts не існує — створити
        if (!fs.existsSync(indexPath)) {
            fs.writeFileSync(indexPath, `import ${importName} from './${importName}.module.scss';\n\nexport const ${className} = {\n  ${importName}: ${importName}.${importName}\n};\n`);
        } else {
            // Якщо існує — зчитати, оновити
            let content = fs.readFileSync(indexPath, 'utf-8');

            // Якщо імпорту ще нема
            if (!content.includes(`'./${importName}.module.scss'`)) {
                const importLine = `import ${importName} from './${importName}.module.scss';\n`;
                content = importLine + content;
            }

            // Оновити export-обʼєкт
            const exportRegex = new RegExp(`export const ${className} = \\{([\\s\\S]*?)\\};`);
            const match = content.match(exportRegex);
            if (match) {
                let existing = match[1].trim();
                if (!existing.includes(`${importName}:`)) {
                    existing += `,\n  ${importName}: ${importName}.${importName}`;
                }
                const updatedExport = `export const ${className} = {\n  ${existing.trim()}\n};`;
                content = content.replace(exportRegex, updatedExport);
            }
            fs.writeFileSync(indexPath, content);
        }

        // work with tsx
        const componentPath = path.join(root, 'src', 'components', type, `${name}.tsx`);
        fs.mkdirSync(path.dirname(componentPath), { recursive: true });
        fs.writeFileSync(componentPath, `import {${className}} from '@/styles/${type}';\n\nexport const ${capitalize(name)} = () => {\n  return <div className={${className}.${name}}>${name}</div>;\n};\n`);


        vscode.window.showInformationMessage(`Component "${name}" created in "${type}"`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
