#!/usr/bin/env node

var program = require("commander");
var create = require("../src/index");

program
	.version('1.0.0')
	.option("-i, --input <files>", "Glob pattern to specify the documents to process")
  .option("-o, --output-directory <path>", "The directory to output the processed documents to. If this param is not set the output is sent to stdout.")
  .option("-r, --property-removal-indicator <indicator>", "Remove all properties containing this value. Defaults to '__NILL__'.")
  .option("-s, --skip-schema-validation", "Skip JSON schema validation. Defaults to false.")
  .option("-v, --no-verbose", "Verbose output")
  .option("-V, --no-verbose", "No verbose output")
	.parse(process.argv);

var config = {
  input: trimSingleQuotes(program.input),
  outputDirectory: trimSingleQuotes(program.outputDirectory),
  propertyRemovalIndicator: program.propertyRemovalIndicator,
  skipSchemaValidation: program.skipSchemaValidation,
  verbose: program.verbose
};

create(config);

function trimSingleQuotes(input) {
  if (typeof input === "string") {
    input = input.replace(/^'/, '').replace(/'$/, '');
  }
  return input;
}
