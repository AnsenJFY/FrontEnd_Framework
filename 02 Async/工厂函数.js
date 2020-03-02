function isType(type){
  return function(params){
    return Object.prototype.toString.call(params) ===`[object ${type}]`
  }
}

let isArray = new isType('Array')

console.log(isArray('[]'))
