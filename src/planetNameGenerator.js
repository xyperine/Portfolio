import * as utils from "#src/utils.js";
import { PlanetName } from "#src/planetName.js";

export class PlanetNameGenerator {
    constructor() {
    }

    generate() {
        const index = this.generateIndex();
        const name = this.generateName(index);
        const designation = this.generateDesignation(index);

        return new PlanetName(index, name, designation);
    }

    generateIndex() {
        const index = Math.round(utils.randGaussianConstrained(1, 12, 4, 3));
        return index;
    }

    generateName(index) {
        const parentName = this.generateParentName();
        const nameSuffix = this.generateSuffix(index);
        const separator = " "
        const name = `${parentName}${separator}${nameSuffix}`;

        return name;
    }

    generateParentName() {
        const fragments = [
            "ael", "aer", "aeth", "al", "ara", "ari", "aur",
            "cal", "cae", "cel", "cor", "cyr",
            "dae", "dar", "del", "dra", "dren",
            "el", "ela", "ely", "eon", "era",
            "kae", "kai", "kal", "kar",
            "lae", "lor", "lyr", "lys",
            "mae", "mar", "mel", "mor",
            "nae", "nar", "nel", "ner", "nym",
            "ora", "ori", "orn",
            "rae", "ral", "ren", "ria", "ryn",
            "sae", "sar", "sel", "sol", "syr",
            "tha", "the", "tir", "tor",
            "vae", "val", "var", "vel", "vey", "vor",
            "xae", "xan", "xel",
            "zae", "zar", "zel", "zer"
        ];
        const fragmentsCount = Math.floor(Math.random() * 2) + 1;
        let name = "";
        for (let i = 0; i < fragmentsCount; i++) {
            const fr = utils.randomElement(fragments);
            name += fr;

            fragments.splice(fragments.indexOf(fr), 1);
        }

        if (fragmentsCount == 1) {
            const endings = ["ar", "ides", "ion", "lia", "us", "ix", "ius"];
            name += utils.randomElement(endings);
        } else if (fragmentsCount < 3) {
            if (Math.random() < 0.35) {
                const endings = ["ar", "ides", "ion", "lia", "us", "ix", "ius"];
                name += utils.randomElement(endings);
            }
        }
        name = name.toLowerCase();
        name = utils.capitalize(name);
        return name;
    }

    generateSuffix(index) {
        const SCHEME = {
            Letter: 0,
            Numeral: 1,
            RomanNumeral: 2,
            Word: 3
        }

        const availableIndexSchemes = [SCHEME.Letter, SCHEME.Numeral, SCHEME.RomanNumeral, SCHEME.Word];
        let indexScheme = utils.randomElement(availableIndexSchemes);
        let suffix = "";
        switch (indexScheme) {
            case SCHEME.Letter: {
                const letterCode = 97 + index - 1;
                suffix = String.fromCharCode(letterCode);
                break;
            }
            case SCHEME.Numeral: {
                suffix = String(index);
                break;
            }
            case SCHEME.RomanNumeral: {
                suffix = utils.toRoman(index);
                break;
            }
            case SCHEME.Word: {
                const words = ["Prime", "Majoris", "Minoris", "Secondus", "Tertius", "Alpha", "Beta", "Gamma", "Nova"];
                suffix = utils.randomElement(words);
                break;
            }
            default:
                break;
        }

        return suffix;
    }

    generateDesignation(index) {
        const parentDesignation = this.generateParentDesignation();
        const designationSuffix = this.generateDesignationSuffix(index);
        const designation = `${parentDesignation} ${designationSuffix}`;

        return designation;
    }

    generateParentDesignation() {
        const catalogs = ["KL", "FS", "ZO", "RX", "VX"];
        const index = String(Math.round(Math.random() * 10_000)).padStart(4, "0");
        const name = `${utils.randomElement(catalogs)}-${index}`;
        return name;
    }

    generateDesignationSuffix(index) {
        const SCHEME = {
            Letter: 0,
            Numeral: 1,
            RomanNumeral: 2
        }

        const availableIndexSchemes = [SCHEME.Letter, SCHEME.Numeral, SCHEME.RomanNumeral];
        const indexScheme = utils.randomElement(availableIndexSchemes);

        let suffix = "";
        switch (indexScheme) {
            case SCHEME.Letter: {
                const letterCode = 97 + index - 1;
                suffix = String.fromCharCode(letterCode);
                break;
            }
            case SCHEME.Numeral: {
                suffix = String(index);
                break;
            }
            case SCHEME.RomanNumeral: {
                suffix = utils.toRoman(index);
                break;
            }
            default:
                break;
        }

        return suffix;
    }
}