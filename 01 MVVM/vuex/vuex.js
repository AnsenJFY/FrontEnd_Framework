// Vuex
let Vue;
// 自定义的forEach方法
let forEach = (obj, callback) =>{
  Object.keys.forEach(key => {
    callback(key,obj[key])
  })
}
class Store {
  // 获取用户实例化Store时传入的参数
  constructor(options){
    // 内置一个Vue实例
    this.vm = new Vue({
      data:{
        state: options.state
      }
    })
    // getter
    let getters = options.getters
    this.getters = {}
    forEach(getters,(getterName, value) => {
      Object.defineProperty(this.getters, getterName, {    // 订阅
        get:() => {
          return value(this.state)
        }
      })
    })
    // mutation
    let mutations = options.mutations
    this.mutations = {}
    forEach(mutations, (mutationName, value) => {
      this.mutations[mutationName] = (payload) => {   // 订阅
        value(this.state, payload)
      }
    })
    // action
    let actions = options.actions
    this.actions = {}
    forEach(actions, (actionName, value) => {
      this.actions[actionName] = (payload) => {   // 订阅
        value(this, payload)
      }
    })
    // 订阅commit
    commit = (mutationName, payload) => {
      this.mutations[mutationName](payload)
    }
    // 订阅dispatch
    dispatch = (actionName, payload) => {
      this.actions[actionName](payload);
    }
    // 动态注册模块
    registerModule(moduleName, module){
      if(!Array.isArray(moduleName)){
        moduleName = [moduleName]
      }
      // 将模块进行了格式化
      this.modules.register(moduleName, module)
      installModule(this, this.state, [], this.modules.root)
    }
    // ES6中类的属性访问器 ES5中defineProperty的语法糖
    // 获取实例上的state时会触发此方法
    get state(){
      return this.vm.state
    }
  }
}

// Module 模块
class ModuleConllection{
  // 获取用户实例化Module时传递的参数
  constructor(option){
    // 通过递归，遍历用户传入的参数，变成统一的数据格式
    // 目标格式
    // let root = {
    //   _raw = rootModule,
    //   state = rootModule.state,
    //   _children = {
    //     a: {
    //       _raw = aModule,
    //       state = aModule.state,
    //       _children = {}
    //     },
    //     b: {
    //       _raw = bModule,
    //       state = bModule.state,
    //       _children = {
    //         c: {
    //           _raw = cModule,
    //           state = cModule.state,
    //           _children = {}
    //         }
    //       }
    //     }
    //   }
    // }
    this.register([],option)
  }
  register(path, rootModule){
    let rawModule = {
      _raw = rootModule,
      state = rootModule.state,
      _children = {}
    }
    if(!this.root){
      this.root = rawModule
    }else{
      // 不停的寻找要定义的模块，将这个模块定义到他的父亲上
      let parentModule = path.slice(0, -1).reduce((root, current)=>{
        return root._children[current]
      })
      parentModule._children[path[path.length - 1]] = rawModule
    }
    if(!rootModule.modules){
      forEach(rootModule.modules, (moduleName, module) => {
        this.register(path.concat(moduleName), module)
      })
    }
  }
}

// store.registerModule 注册新的模块
function installModule(store, rootState, path, rawModule){
  // 没有安装我们的状态？？？需要把子模块的状态定义到rootState上
  if(path.length > 0){ // 如果当前path的长度大于0 说明有子模块存在
    // Vue的响应式原理 不能增加不存在属性
    let parentState = path.slice(0, -1).reduce((root, current) => {
      // ？？？
      return rootState[current]   // [b,c]
    },rootState)
    // 给这个根状态定义当前的模块的名字是path的最后一项
    Vue.set(parentState, path[path.length - 1], rawModule.state)
  }
  // 定义getters
  let getters = rawModule._raw.getters
  if(getters){
    forEach(getters,(getterName, value) => {
      Object.defineProperty(store.getters, getterName, {
        get: () => {
          return value(rawModule.state) // 返回模块中的状态
        }
      })
    })
  }
  // 定义mutations
  let mutation = rawModule._raw.mutations
  if(mutation){
    forEach(mutations, (mutationName, value) => {
      // 将store.mutations[mutationName]置为空数组并赋值给arr
      let arr = store.mutation[moduleName] || (store.mutations[mutationName] = [])
      arr.push((payload)=>{
        value(rawModule.state, payload)
      })
    })
  }

  // 定义actions
  // 所有模块上的同名action都会被触发
  let actions = rawModule._raw.actions
  if(actions){
    forEach(actions, (actionName, value) => { // 订阅模式
      let arr = store.actions[actionName] || (store.actions[actionName] = [])
      arr.push((payload) => {
        value(store, payload)
      })
    })
  }
  forEach(rawModule, _children, (moduleName, rawModule) => {
    installModule(store, rootState, path.concat(moduleName), rawModule)
  })
}

const install = (_Vue) => {
  // 使用Vue.use(xxx)时 会执行xxx的install方法，并将Vue构造函数传递过来
  Vue = _Vue
  Vue.mixin({
    // 使用mixins混入，是每个组件都能访问到$store
    // 混入的钩子函数会提前执行
    beforeCreate(){
      if(this.$options.store){
        // 实例化Vue的时候，传入的参数就是$options，
        // 只获取当前的根实例，避免在每个实例上都添加$store
        this.$store = this.$options.store
      }else{
        this.$store = this.$parent && this.$parent.store // 递归寻找当前组件的父组件，并获取父组件中的store
      }
    }
  })
}