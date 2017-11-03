
## 权限校验组件
理想的权限校验是权限校验作为HOC组件，在组件层全部解决、无需在Page、Components中添加无效的业务代码。
但是又要考虑到组件复用、不想修改组件代码，所以有时只能通过在Page中引入权限校验，来在动态管理子组件。
权限校验组件分为两种模式，一种是根据组件名称`displayName`自动隐藏显示，另一种是返回组件所需的权限字段`this.props.$auth`。

## API
### registerAuthRules
注册权限规则列表，支持同步规则和异步规则
参数:
- rules {Object} 应用权限规则MAP

调用查看
```
    export const AUTH_RULES = {
        'isCompanyAccount': window.isCA === '',
        'iscanDeleteOrder': () => {
            return new Promise((resolve, reject) => {
                resolve(result); // resolve的参数只能是true或者false
            })
        },
    };

    registerAuthRules(AUTH_RULES)
```

### registerComponentRules
注册组件显示规则，根据组件displayName配置组件所需权限列表
参数:
- rules {Object} 组件权限规则MAP

调用查看
```
    export const COMPONENTS_RULES = {
        ComponentA: 'isCompanyAccount',
        ComponentB: 'isCompanyAccount && iscanDeleteOrder',
        // StepFinish: [],
    };

    registerComponentRules(COMPONENTS_RULES)
```


### Auth
参数:
- options {Object} 组件权限规则MAP
- options.placeholder {Component} 组件隐藏时的占位节点；默认为`noscript`
- options.initialHide {Boolean} 当存在异步权限规则时，组件是否先默认隐藏；默认值为`true`
- options.rules {Object} 配置组件需要权限规则集合，作为props属性$auth传递给组件

### 1. 组件级别权限控制
根据WrappedComponent.displayName判断组件是否有权限

```javascript

class Component{
  // ...
}
Component.displayName = 'ComponentA';

const Authed_Component_1 = Auth({
  placeholder: <p>无权限的占位节点</p>
})(Component)
```

### 2. 组件内部权限控制（权限属性模式）
```javascript
class Page{
  render(){
    const {$auth} = this.props;
    return (
      <div>
        { $auth.isApass && <p>Apass用户</p> }
        { $auth.isMale && <p>男性用户</p> }
      </div>
    )
  }
}
// 权限校验条件与权限属性，组件内容没有校验逻辑
const Authed_Page = Auth({
  rules: {
    'isApass': 'isVip && isScoreThan2000',
    'isMale': 'isMale'
  }
})(Page);
```

## 其他

### 当rules中存在异步规则
在异步规则的promise全部返回前，权限key的值为`undefined`.例如，上面代码中，如果is-vip需要拉取接口，则Page中会先拿到{isMale:true},而在componentWillReceiveProps后会拿到{isMale:true,isApass:true}的值。

### this.props.$auth
$auth都是异步生成的，如果需要在非ui层面使用$auth做逻辑控制，建议在component.componentWillReceiveProps中监听$auth的变化
