Summary
=======

This is a Broccoli plugin that renames files based on a digest JSON file.


Config Example
==============

```javascript
{
  digestPath: "digest.json"
}
```


Usage Example
=============

```javascript
var fileRenamer = require('broccoli-FileRenamer');

//...

var renamedFileTree = fileRenamer(anotherFileTree, {
    digestPath: 'digest.json'
});

```


Example Digest JSON
==========================

```json
{
  "src/Foo.js": "src/Foo-e2246d0f58599ee36fd42d7676594171.js"
}
```

Using the above digest JSON mapping, the `src/Foo.js` file will be renamed to `src/Foo-e2246d0f58599ee36fd42d7676594171.js`.
