var Ajv = require("ajv");
var ajv = new Ajv();
var deepFilter = require("deep-filter");
var fsExtra = require("fs-extra");
var glob = require("glob");
var jsonMerger = require("json-merger");
var merger = new jsonMerger.Merger();
var path = require("path");
var xmlbuilder = require("xmlbuilder");
var yaml = require("js-yaml");

/*
 * CREATION
 */

function create(userConfig) {
  // Set config defaults
  var config = {
    propertyRemovalIndicator: "__NILL__",
    skipSchemaValidation: false,
    verbose: true
  };

  // Set config overrides
  Object.keys(userConfig).forEach(function(key) {
    if (typeof userConfig[key] !== "undefined") {
      config[key] = userConfig[key];
    }
  });

  // Only output info if an output directory is defined
  config.outputInfo = config.outputDirectory !== undefined;

  // Log
  log("creating documents", config, false);

  // Find input files
  var filePaths = glob.sync(config.input);

  // process each document
  filePaths.forEach(function(filePath) {
    // Log
    log('processing "' + filePath + '"', config, true);

    // Do merge
    var mergedFile = merger.mergeFile(filePath);

    // Remove values matching the propertyRemovalIndicator
    var filteredFile = deepFilter(mergedFile, function(value) {
      return value !== config.propertyRemovalIndicator;
    });

    // Get document descriptions
    var descriptions = Array.isArray(filteredFile)
      ? filteredFile
      : [filteredFile];

    // Process the document descriptions
    descriptions.forEach(function(description) {
      // Validate if needed
      if (!config.skipSchemaValidation && description.config.validationSchema) {
        var schemaPath = path.resolve(
          path.dirname(filePath),
          description.config.validationSchema
        );
        var compiledSchema = loadCompiledJsonSchema(schemaPath);

        if (!compiledSchema(description)) {
          var message =
            "An error was found while validating " + filePath + "\n\n";
          message += "JSON:\n";
          message += JSON.stringify(description, undefined, 2) + "\n";

          compiledSchema.errors.forEach(function(error) {
            message +=
              '\nMessage:\nThe property "' +
              error.dataPath +
              '" ' +
              error.message;
            message += "\n\nRule:\n" + schemaPath + error.schemaPath + "\n";
          });

          throw new Error(message);
        }
      }

      // Generate output
      var output;

      // Generate json output if needed
      if (description.config.outputFormat === "json") {
        output = JSON.stringify(description.document, undefined, 2);
      }

      // Generate xml output if needed
      if (description.config.outputFormat === "xml") {
        output = xmlbuilder
          .create(description.document, { encoding: "UTF-8" })
          .end({ pretty: true });
      }

      // Write output to console?
      if (config.outputDirectory === undefined) {
        console.log(output);
        return;
      }

      // Write to file
      var outputFilePath = path.join(
        config.outputDirectory,
        description.config.outputDirectory,
        description.config.outputFilename
      );
      fsExtra.outputFileSync(outputFilePath, output, "utf8");

      // Log
      log('wrote "' + outputFilePath + '"', config, true);
    });
  });

  // Log
  log("created documents", config, false);
}

/*
 * LOADING
 */

var jsonSchemaCache = {};

function loadCompiledJsonSchema(filePath) {
  if (jsonSchemaCache[filePath] === undefined) {
    var schemaContent = loadJsonOrYamlFile(filePath);
    jsonSchemaCache[filePath] = ajv.compile(schemaContent);
  }
  return jsonSchemaCache[filePath];
}

var fileCache = {};

function loadJsonOrYamlFile(filePath) {
  if (fileCache[filePath] === undefined) {
    var content = fsExtra.readFileSync(filePath, "utf8");

    var parsedContent;

    if (/\.ya?ml$/.test(filePath)) {
      parsedContent = yaml.safeLoad(content, {
        filename: filePath,
        schema: yaml.JSON_SCHEMA
      });
    } else {
      parsedContent = JSON.parse(content);
    }

    fileCache[filePath] = parsedContent;
  }

  return fileCache[filePath];
}

/*
 * LOGGING
 */

function log(message, config, verbose) {
  if (!config.outputInfo) {
    return;
  }

  if (verbose && !config.verbose) {
    return;
  }

  console.log("data-document-creator: " + message);
}

/*
 * EXPORTS
 */

module.exports = create;
