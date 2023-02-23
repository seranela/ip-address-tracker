(() => {

/* --- GeoApi Config --- */

const geoApiParams = {
	'url': 'https://geo.ipify.org/api/v2/country,city',
	// Note: Exposing API Key here is of no concern since it's a free account
	'apiKey': 'at_sUhquAgb9ziI4HDYY4v17OLkMK6xH'
};

/* --- Leaflet Map Initial Setup --- */

let map = L.map('map', {
	zoomControl: false,
	zoom: 15
});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
let customIcon = L.icon({
	iconUrl: './images/icon-location.svg',
	iconSize: [46, 56],
	iconAnchor: [23, 55],
	popupAnchor: [-3, -76]
});
let latlng = L.latLng(0, 0);
let mapMarker = undefined; // This will hold the current map marker

/* --- Update Map Results Information --- */

function updateMap(location) {
	// If map marker exists on map, remove it first.
	if (mapMarker != undefined) {
		map.removeLayer(mapMarker);
	}
	// Create new map marker with alt text for accessibility
	mapMarker = L.marker(latlng, { icon: customIcon, alt: `${location.city}, ${location.region} ${location.postalCode}` });
	map.addLayer(mapMarker);

	// Center map
	let offset = map.getSize().y * 0.2;
	map.setView(latlng);
	map.panBy(new L.Point(0, -offset), { animate: false });
}

const inputQuery = document.querySelector('#input-query');
const buttonSearch = document.querySelector('#button-search');
const infoIpAddress = document.querySelector('#result-ip-address');
const infoLocation = document.querySelector('#result-location');
const infoTimezone = document.querySelector('#result-timezone');
const infoIsp = document.querySelector('#result-isp');

function updateInfo(ip, location, isp) {
	infoIpAddress.innerText = ip;
	infoLocation.innerText = `${location.city}, ${location.region} ${location.postalCode}`;
	infoTimezone.innerText = `UTC ${location.timezone}`;
	infoIsp.innerText = isp;
}

/* --- Regular expressions for data validation --- */

// IPv4 & IPv6
const regexpIpAddress = /(?:^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}$)|(?:^(?:(?:[a-fA-F\d]{1,4}:){7}(?:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){6}(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|:[a-fA-F\d]{1,4}|:)|(?:[a-fA-F\d]{1,4}:){5}(?::(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,2}|:)|(?:[a-fA-F\d]{1,4}:){4}(?:(?::[a-fA-F\d]{1,4}){0,1}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,3}|:)|(?:[a-fA-F\d]{1,4}:){3}(?:(?::[a-fA-F\d]{1,4}){0,2}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,4}|:)|(?:[a-fA-F\d]{1,4}:){2}(?:(?::[a-fA-F\d]{1,4}){0,3}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,5}|:)|(?:[a-fA-F\d]{1,4}:){1}(?:(?::[a-fA-F\d]{1,4}){0,4}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,6}|:)|(?::(?:(?::[a-fA-F\d]{1,4}){0,5}:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}|(?::[a-fA-F\d]{1,4}){1,7}|:)))(?:%[0-9a-zA-Z]{1,})?$)/gm;
// Domain Names
const regexpDomain = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,6}/i;

/* --- GeoLocation Search --- */

function getGeoInfo(e) {
	if (e) e.preventDefault();

	// Data validation

	const inputQueryValue = inputQuery.value.trim();

	let requestURL = new URL(geoApiParams.url);
	requestURL.searchParams.set('apiKey', geoApiParams.apiKey);

	if (inputQueryValue.length > 0) {
		if (regexpIpAddress.test(inputQueryValue)) {
			// IP addresses
			requestURL.searchParams.set('ipAddress', inputQueryValue);
			inputQuery.classList.remove('input-invalid');
		} else if (regexpDomain.test(inputQueryValue)) {
			// Domain names
			requestURL.searchParams.set('domain', inputQueryValue);
			inputQuery.classList.remove('input-invalid');
		} else {
			// Show input warning
			inputQuery.classList.add('input-invalid');
		}
	} else if (inputQueryValue == '') {
		// Show input warning
		inputQuery.classList.remove('input-invalid');
	}

	// Data request & processing

	// Get data via Fetch API
	if (window.fetch) {
		fetch(requestURL, { method: 'GET', cache: 'no-cache' })
			.then(response => response.json())
			.then(data => {
				updateInfo(data.ip, data.location, data.isp);
				latlng.lat = data.location.lat;
				latlng.lng = data.location.lng;
				updateMap(data.location);
			})
			.catch(err => console.error(err));
	}
	// Get data via XMLHttpRequest (Fallback)
	else {
		const sendRequest = (method, url) => {
			const promise = new Promise((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open(method, url);
				xhr.responseType = 'json';
				xhr.setRequestHeader('Cache-Control', 'no-cache');
				xhr.onload = () => {
					if (xhr.status >= 400) {
						reject(xhr.response);
					}
					resolve(xhr.response);
				};
				xhr.send();
			});
			return promise;
		};
		const getData = async () => {
			try {
				const response = await sendRequest('GET', requestURL);
				updateInfo(response.ip, response.location, response.isp);
				latlng.lat = response.location.lat;
				latlng.lng = response.location.lng;
				updateMap(response.location);
			} catch (err) {
				console.error(err);
			}
		};
		getData();
	}
}

buttonSearch.addEventListener('click', getGeoInfo);

// Clear the search query
inputQuery.value = '';

// Get location info
getGeoInfo();

})();