module.exports = function (babel) {
    const { types: t } = babel;

    return {
        visitor: {
            ImportDeclaration(path) {
                // 检查是否存在命名导入
                let hasNamedImports = path.node.specifiers.some(specifier => t.isImportSpecifier(specifier));

                if (hasNamedImports) {
                    // 生成一个唯一的标识符作为默认导入的名称
                    let defaultImportIdentifier = path.scope.generateUidIdentifier("defaultImport");

                    // 创建默认导入声明
                    let importDefaultSpecifier = t.importDefaultSpecifier(defaultImportIdentifier);
                    let importDefaultDeclaration = t.importDeclaration([importDefaultSpecifier], path.node.source);

                    // 插入默认导入
                    path.insertBefore(importDefaultDeclaration);

                    // 针对每个命名导入创建解构赋值
                    path.node.specifiers.forEach((specifier) => {
                        if (t.isImportSpecifier(specifier)) {
                            let variableDeclarator = t.variableDeclarator(
                                t.identifier(specifier.local.name),
                                t.memberExpression(defaultImportIdentifier, specifier.imported)
                            );
                            let variableDeclaration = t.variableDeclaration("const", [variableDeclarator]);
                            path.insertAfter(variableDeclaration);
                        }
                    });

                    // 移除原始的导入声明
                    path.remove();
                }
            }
        }
    };
};
