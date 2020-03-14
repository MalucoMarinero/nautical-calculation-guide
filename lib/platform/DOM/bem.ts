import cx from './cx'

export default function(blockName: string) {
  return function(classObj: string | {[key: string]: boolean}) {
    if (typeof classObj == "string") {
      return classObj.split("&").join(blockName);
    } else {
      return cx(classObj, blockName);
    }
  }
};
