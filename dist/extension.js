"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function activate(context) {
    console.log('Component Generator is now active!');
    const disposable = vscode.commands.registerCommand('component-generator.create', () => __awaiter(this, void 0, void 0, function* () {
        // === 1. Перевіряємо чи вже є режим ===
        let mode = context.globalState.get('componentGeneratorMode');
        if (!mode) {
            mode = yield vscode.window.showQuickPick(['nextjs', 'gulp'], {
                placeHolder: 'Select project type'
            });
            if (!mode)
                return;
            yield context.globalState.update('componentGeneratorMode', mode);
        }
        // === 2. Вибір типу компонента ===
        const type = yield vscode.window.showQuickPick(mode === 'nextjs'
            ? ['feature', 'layout', 'ui', 'modals']
            : ['components', 'ui', 'templates'], { placeHolder: 'Select component type' });
        if (!type)
            return;
        const name = yield vscode.window.showInputBox({
            prompt: 'Enter component name (without extension)',
            validateInput: text => text ? null : 'Name cannot be empty'
        });
        if (!name)
            return;
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder open');
            return;
        }
        const root = workspaceFolders[0].uri.fsPath;
        // === 3. Логіка під конкретний режим ===
        if (mode === 'nextjs') {
            createNextComponent(root, type, name);
        }
        else if (mode === 'gulp') {
            createGulpComponent(root, type, name);
        }
    }));
    context.subscriptions.push(disposable);
}
function deactivate() { }
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
// === Next.js шаблон ===
function createNextComponent(root, type, name) {
    const stylePath = path.join(root, 'src', 'styles', type, `${name}.module.scss`);
    fs.mkdirSync(path.dirname(stylePath), { recursive: true });
    fs.writeFileSync(stylePath, `.root {\n  // styles\n}\n`);
    const componentName = capitalize(name);
    const componentPath = path.join(root, 'src', 'components', type, `${componentName}.tsx`);
    fs.mkdirSync(path.dirname(componentPath), { recursive: true });
    fs.writeFileSync(componentPath, `import styles from '@/styles/${type}/${name}.module.scss';

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
    }
    else {
        const componentIndexContent = fs.readFileSync(componentIndexPath, 'utf-8');
        if (!componentIndexContent.includes(`'./${componentName}'`)) {
            fs.appendFileSync(componentIndexPath, exportLine);
        }
    }
    vscode.window.showInformationMessage(`Next.js component "${componentName}" created in "${type}"`);
}
// === Gulp шаблон ===
function createGulpComponent(root, type, name) {
    // HTML
    const htmlPath = path.join(root, 'src', 'html', type, `${name}.html`);
    fs.mkdirSync(path.dirname(htmlPath), { recursive: true });
    fs.writeFileSync(htmlPath, `<section class="${name}"></section>\n`);
    // SCSS
    const scssPath = path.join(root, 'src', 'scss', type, `_${name}.scss`);
    fs.mkdirSync(path.dirname(scssPath), { recursive: true });
    fs.writeFileSync(scssPath, `@use '../helpers' as *;

.${name} {
    
}
`);
    // update _index.scss поруч
    const indexPath = path.join(root, 'src', 'scss', type, `_index.scss`);
    const forwardLine = `@forward '${name}';\n`;
    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath, forwardLine);
    }
    else {
        const indexContent = fs.readFileSync(indexPath, 'utf-8');
        if (!indexContent.includes(`'${name}'`)) {
            fs.appendFileSync(indexPath, forwardLine);
        }
    }
    vscode.window.showInformationMessage(`Gulp component "${name}" created in "${type}"`);
}
