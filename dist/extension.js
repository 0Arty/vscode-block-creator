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
        const type = yield vscode.window.showQuickPick(['feature', 'layout', 'ui'], {
            placeHolder: 'Select component type'
        });
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
        // Work with scss
        const styleIndexPath = path.join(root, 'src', 'styles', type, `index.ts`);
        const importName = name.toLowerCase();
        const className = `${type}Styles`;
        const stylePath = path.join(root, 'src', 'styles', type, `${name}.module.scss`);
        fs.mkdirSync(path.dirname(stylePath), { recursive: true });
        fs.writeFileSync(stylePath, `.${importName} {\n  // styles\n}\n`);
        // Якщо index.ts для стилів не існує — створити
        if (!fs.existsSync(styleIndexPath)) {
            fs.writeFileSync(styleIndexPath, `import ${importName} from './${importName}.module.scss';\n\nexport const ${className} = {\n  ${importName}: ${importName}.${importName}\n};\n`);
        }
        else {
            // Якщо існує — зчитати, оновити
            let content = fs.readFileSync(styleIndexPath, 'utf-8');
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
                    existing += existing ? `,\n  ${importName}: ${importName}.${importName}` : `${importName}: ${importName}.${importName}`;
                }
                const updatedExport = `export const ${className} = {\n  ${existing.trim()}\n};`;
                content = content.replace(exportRegex, updatedExport);
            }
            fs.writeFileSync(styleIndexPath, content);
        }
        // Work with tsx
        const componentPath = path.join(root, 'src', 'components', type, `${name}.tsx`);
        fs.mkdirSync(path.dirname(componentPath), { recursive: true });
        fs.writeFileSync(componentPath, `import {${className}} from '@/styles/${type}';\n\nexport const ${capitalize(name)} = () => {\n  return <div className={${className}.${importName}}>${name}</div>;\n};\n`);
        // Work with component index.ts
        const componentIndexPath = path.join(root, 'src', 'components', type, `index.ts`);
        const exportLine = `export * from './${name}';\n`;
        // Якщо index.ts для компонентів не існує — створити
        if (!fs.existsSync(componentIndexPath)) {
            fs.writeFileSync(componentIndexPath, exportLine);
        }
        else {
            // Якщо існує — додати новий експорт, якщо його ще немає
            let componentIndexContent = fs.readFileSync(componentIndexPath, 'utf-8');
            if (!componentIndexContent.includes(`'./${name}'`)) {
                componentIndexContent += exportLine;
                fs.writeFileSync(componentIndexPath, componentIndexContent);
            }
        }
        vscode.window.showInformationMessage(`Component "${name}" created in "${type}"`);
    }));
    context.subscriptions.push(disposable);
}
function deactivate() { }
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
