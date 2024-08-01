const scrapeAutocomplete = async <U>(query: U, map: Map<U, U>) => {
	if (map.has(query)) return
	const { data } = await axios.get(
		`https://www.bikewale.com/api/v3/autocomplete/?source=1%2C2%2C3%2C5%2C11%2C15%2C13%2C10%2C16%2C17%2C4%2C8%2C18%2C6%2C7&value=${query}&size=40&isNcf=false&applicationId=2`,
	)

	map.set(query, query)
	if (!data) return

	for (const item of data) {
		if (
			"payload" in item &&
			"maskingName" in item.payload &&
			"modelName" in item.payload &&
			item.payload.modelName === ""
		) {
			console.log(item.payload.maskingName)
			await scrapeAutocomplete(item.payload.maskingName, map)
		} else {
			if (item.payload.bodyStyles && item.payload.bodyStyles.length > 0) {
				for (const bodyStyle of item.payload.bodyStyles) {
					try {
						await db
							.insert(vehicle)
							.values({
								make: item.payload.makeName,
								model: item.payload.modelName,
								vehicleType: bodyStyle.Name,
								combinedKey: `${item.payload.makeName} ${item.payload.modelName} ${bodyStyle.Name}`,
							})
							.execute()
					} catch (e) {}
				}
			} else {
				try {
					await db
						.insert(vehicle)
						.values({
							make: item.payload.makeName,
							model: item.payload.modelName,
							vehicleType: "NA",
							combinedKey: `${item.payload.makeName} ${item.payload.modelName}`,
						})
						.execute()
				} catch (e) {}
			}
		}
	}
}

const bodyStyleId2Name = (id: number) => {
	switch (id) {
		case 5:
			return "Scooter"
		case 1:
			return "Cruiser"
		case 12:
			return "Sports Bike"
		case 15:
			return "Tourer"
		case 11:
			return "Scrambler"
		case 7:
			return "Adventure"
		case 13:
			return "Street Bike"
		case 16:
			return "Moped"
		case 14:
			return "Super bike"
		case 8:
			return "Cafe Racer"
		case 9:
			return "Commuter"
		case 10:
			return "Maxi Scooter"
		default:
			return "NA"
	}
}

const scrapeModels = async (make: number) => {
	const res = await axios.get(
		`https://www.bikewale.com/api/make/${make}/models/?bodyStyleIds=12%2C5%2C1%2C9%2C13%2C14%2C8%2C11%2C7%2C16%2C15%2C10`,
	)

	if (!res.data) return

	for (const item of res.data) {
		const type = bodyStyleId2Name(item.bodyStyleId)
		await db
			.insert(vehicle)
			.values({
				make: item.makeName,
				model: item.modelName,
				vehicleType: type,
				combinedKey: `${item.makeName} ${item.modelName} ${type}`,
			})
			.execute()
	}
}

