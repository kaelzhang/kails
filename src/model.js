module.exports = model

const ontology = {}
function NOOP () {}

// Model
///////////////////////////////////////////////////

function model (name) {
  const model = ontology.collections[name]

  return model
}

model.set_connection = ({
  collections
}) => {
  ontology.collections = collections
  exports.set_connection = NOOP
}
