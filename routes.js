/*
 * Routes
 */

var prefix = '/api';

app.post(prefix + '/vendor/:vendor([a-z0-9-]+)/update', vendor.updateVendor);
app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/update', vendor.updateVendor);
app.del(prefix + '/vendor/:vendor([a-z0-9-]+)/delete', vendor.deleteVendor);
app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/delete', vendor.deleteVendor);
app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/', vendor.getVendor);
app.post(prefix + '/vendor/add', vendor.addVendor);
app.get(prefix + '/vendor/add', vendor.addVendor);
app.get(prefix + '/vendor/list', vendor.getAllVendors);
app.get(prefix + '/vendor/', vendor.getAll);

// Offer Type can be passed as ?type=[offer type] parameter
app.get(prefix + '/offer/list', offer.getAllOffers);
app.get(prefix + '/offer/category', offer.getCategories);

app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/:offer([a-z0-9-]+)/view', offer.updateViewCount);
app.post(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/:offer([a-z0-9-]+)/update', offer.updateOffer);
app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/:offer([a-z0-9-]+)/update', offer.updateOffer);
app.del(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/:offer([a-z0-9-]+)/delete', offer.deleteOffer);
app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/:offer([a-z0-9-]+)/delete', offer.deleteOffer);
app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/:offer([a-z0-9-]+)/', offer.getOffer);
app.post(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/add', offer.addOffer);
app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/add', offer.addOffer);
app.get(prefix + '/vendor/:vendor([a-z0-9-]+)/offer/', offer.getAll);