export function vertConvert(str) {
	let resMas = [{}, [], {}];
	const mas = str.replace(/\r\n/g, "").split("= ");
	let nameAndData,
		tmpmas = [],
		vFlag = false;
	for (let i = 0; i < mas.length; i++) {
		nameAndData = mas[i].split(" =");
		if (nameAndData.length != 2) {
			if (nameAndData[0] == "") continue;
			else console.log("Error parsing vert file");
		}
		if (nameAndData[0][0] == "V") vFlag = true;
		else if (nameAndData[0][0] == "I") {
			vFlag = false;
			tmpmas = nameAndData[1].split(",");
			for (let j = 0; j < tmpmas.length; j++)
				if (tmpmas[j] != "") resMas[1][j] = Number(tmpmas[j]);
		} else {
			if (vFlag) {
				resMas[0][nameAndData[0]] = [];
				tmpmas = nameAndData[1].split(",");
				for (let j = 0; j < tmpmas.length; j++)
					if (tmpmas[j] != "") resMas[0][nameAndData[0]][j] = Number(tmpmas[j]);
			} else {
				resMas[3] = true;
				resMas[2][nameAndData[0]] = [];
				tmpmas = nameAndData[1].split(",");
				for (let j = 0; j < tmpmas.length; j++)
					if (tmpmas[j] != "") resMas[2][nameAndData[0]][j] = Number(tmpmas[j]);
			}
		}
	}
	if (resMas[3] != undefined) console.log("Have any name not V I");
	return resMas;
}
