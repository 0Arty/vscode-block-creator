import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Component Generator is now active!');

    const disposable = vscode.commands.registerCommand('component-generator.create', async () => {
        // === 1. Перевіряємо чи вже є режим ===
        let mode = context.globalState.get<string>('componentGeneratorMode');
        if (!mode) {
            mode = await vscode.window.showQuickPick(['nextjs', 'gulp'], {
                placeHolder: 'Select project type'
            });
            if (!mode) return;
            await context.globalState.update('componentGeneratorMode', mode);
        }

        // === 2. Вибір типу компонента ===
        const type = await vscode.window.showQuickPick(
            mode === 'nextjs'
                ? ['feature', 'layout', 'ui', 'modals']
                : ['components', 'ui', 'templates'],
            { placeHolder: 'Select component type' }
        );
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

        // === 3. Логіка під конкретний режим ===
        if (mode === 'nextjs') {
            createNextComponent(root, type, name);
        } else if (mode === 'gulp') {
            createGulpComponent(root, type, name);
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// === Next.js шаблон ===
function createNextComponent(root: string, type: string, name: string) {
    const stylePath = path.join(root, 'src', 'styles', type, `${name}.module.scss`);
    fs.mkdirSync(path.dirname(stylePath), { recursive: true });
    fs.writeFileSync(stylePath, `.root {\n  // styles\n}\n`);

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
`);

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

    vscode.window.showInformationMessage(`Next.js component "${componentName}" created in "${type}"`);
}

// === Gulp шаблон ===
function createGulpComponent(root: string, type: string, name: string) {
    // HTML
    const htmlPath = path.join(root, 'src', 'html', type, `${name}.html`);
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, `<section class="${name}"></section>\n`);

    // SCSS
    const scssPath = path.join(root, 'src', 'scss', type, `_${name}.scss`);
    fs.mkdirSync(path.dirname(scssPath), { recursive: true });
    fs.writeFileSync(scssPath,
        `@use '../helpers' as *;

.${name} {
    
}
`);

    // update _index.scss поруч
    const indexPath = path.join(root, 'src', 'scss', type, `_index.scss`);
    const forwardLine = `@forward '${name}';\n`;

    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, forwardLine);
    } else {
        const indexContent = fs.readFileSync(indexPath, 'utf-8');
        if (!indexContent.includes(`'${name}'`)) {
            fs.appendFileSync(indexPath, forwardLine);
        }
    }

    vscode.window.showInformationMessage(`Gulp component "${name}" created in "${type}"`);
}
