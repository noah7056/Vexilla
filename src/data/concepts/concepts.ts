import { createConceptFlags } from './utils';

export const CONCEPT_FLAGS = createConceptFlags('Concepts', [
  {
    id: "concept-hydrogen",
    name: "Hydrogen",
    code: "concept-h",
    country: "Concepts",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Hydrogen_discharge_tube.jpg/320px-Hydrogen_discharge_tube.jpg",
    aliases: ["H", "Element 1"],
    tags: ["chemical element", "periodic table"],
    status: ""
  },
  {
    id: "concept-helium",
    name: "Helium",
    code: "concept-he",
    country: "Concepts",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Helium_discharge_tube.jpg/320px-Helium_discharge_tube.jpg",
    aliases: ["He", "Element 2"],
    tags: ["chemical element", "periodic table", "noble gas"],
    status: ""
  },
  {
    id: "concept-carbon",
    name: "Carbon",
    code: "concept-c",
    country: "Concepts",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Diamond_and_graphite.jpg/320px-Diamond_and_graphite.jpg",
    aliases: ["C", "Element 6"],
    tags: ["chemical element", "periodic table"],
    status: ""
  },
  {
    id: "concept-nitrogen",
    name: "Nitrogen",
    code: "concept-n",
    country: "Concepts",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Nitrogen_discharge_tube.jpg/320px-Nitrogen_discharge_tube.jpg",
    aliases: ["N", "Element 7"],
    tags: ["chemical element", "periodic table"],
    status: ""
  },
  {
    id: "concept-oxygen",
    name: "Oxygen",
    code: "concept-o",
    country: "Concepts",
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Oxygen_discharge_tube.jpg/320px-Oxygen_discharge_tube.jpg",
    aliases: ["O", "Element 8"],
    tags: ["chemical element", "periodic table"],
    status: ""
  },
]);
