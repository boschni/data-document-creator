# Data Document Creator

This package can be used to generate JSON and XML documents.

A document is generated with the help of a `document description`.

## `document description`
A `document description` is a JSON or YAML file containing configuration used to generate a `document`.

It should contain the following structure:
```js
{
  "config": Config;
  "document": object;
}
```

It is also possible to define an array with document descriptions to generate multiple documents.

### `config`
The `config` property contains configuration data used when generating the document. Like the filename of the document.

#### `config.outputDirectory`
Use this property to define the directory where the generated document will be saved. For example `test-data/products`.

#### `config.outputFilename`
Use this property to define the generated document filename (with extension). For example `product-1.json`.

#### `config.outputFormat`
Use this property to define the generated document data format. For example `json` or `xml`.

#### `config.validationSchema`
Use this property to define a [JSON Schema](http://json-schema.org) used to validate the `document description`. For example `schemas/product-document-description.json`.

If no `config.validationSchema` is defined it will not validate the document.

### `document`
The `document` property contains the document content.

### Example

**schema.json**
```json
{
  "title": "Product document description",
  "type": "object",
  "properties": {
    "document": {
      "type": "object",
      "properties": {
        "id": {
          "type": "integer"
        },
        "name": {
          "type": "string"
        },
        "price": {
          "type": "integer"
        }
      }
    }
  }
}
```

**product.json**
```json
{
  "config": {
    "outputDirectory": "products",
    "outputFilename": "product-1.json",
    "outputFormat": "json",
    "validationSchema": "schema.json"
  },
  "document": {
    "id": 1,
    "name": "Some product",
    "price": 100
  }
}
```

**Command line**
```sh
data-document-creator -i 'product.json' -o 'test-data'
```

**test-data/products/product-1.json**
```json
{
  "id": 1,
  "name": "Some product",
  "price": 100
}
```

### Example with merging

Input files are merged with `json-merger` before validating and creating the output.

Go to [https://www.npmjs.com/package/json-merger](https://www.npmjs.com/package/json-merger) for more information.

**product-defaults.json**
```json
{
  "config": {
    "outputDirectory": "products",
    "outputFilename": {
      "$afterMerges": {
        "$expression": "`product-${$source.document.id}.json`"
      }
    },
    "outputFormat": "json",
    "validationSchema": "schema.json"
  }
}
```

**product.json**
```json
{
  "$merge": {
    "source": {
      "$import": "product-defaults.json"
    },
    "with": {
      "document": {
        "id": 1,
        "name": "Some product",
        "price": 100
      }
    }
  }
}
```

**Command line**
```sh
data-document-creator -i 'product.json' -o 'test-data'
```

**test-data/products/product-1.json**
```json
{
  "id": 1,
  "name": "Some product",
  "price": 100
}
```

### Command line options

```
Usage: data-document-creator [options]

Options:

  -V, --version                                 output the version number
  -i, --input <files>                           Glob pattern to specify the documents to process
  -o, --output-directory <path>                 The directory to output the processed documents to. If this param is not set the output is sent to stdout.
  -r, --property-removal-indicator <indicator>  Remove all properties containing this value. Defaults to '__NILL__'.
  -s, --skip-schema-validation                  Skip JSON schema validation. Defaults to false.
  -v, --no-verbose                              Verbose output
  -V, --no-verbose                              No verbose output
  -h, --help                                    output usage information
```
