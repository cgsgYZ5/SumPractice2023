export function parser(str) {
	let parsObj = {};
	str = str.replace(/ /g, "");
	let params = str.split("),");

	parsObj.len = params.length;
	parsObj.args = [];
	if (parsObj.len >= 2)
		params.forEach((element) => {
			let arg = {};
			let param = element.split("(");
			arg.name = param[0];
			arg.arg = param[1].replace(")", "").split(",");
			if (arg.arg[0][0] === "f") {
				arg.size = Number(arg.arg[0].replace("f", ""));
			}
			parsObj.args.push(arg);
		});
	return parsObj;
}
