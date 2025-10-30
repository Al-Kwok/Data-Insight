export interface Room {
	fullname: string; // Full building name
	shortname: string; // Short building name
	number: string; // Room number (string, not always numeric)
	name: string; // Room id: shortname + "_" + number
	address: string; // Building address
	lat: number; // Building latitude
	lon: number; // Building longitude
	seats: number; // Number of seats in room
	type: string; // Room type
	furniture: string; // Room furniture
	href: string; // Link to full details online
}
