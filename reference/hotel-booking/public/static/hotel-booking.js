// Ported from tapestry5-hotel-booking's static/hotel-booking.js.
// The original registered a Prototype-era Tapestry.Initializer.initAjaxLoader
// that hid/showed the ajax-loader gif on zone-update / form-submit events.
// Qloom implements that behaviour natively (ProgressiveDisplay + Zones), so the
// initializer is obsolete; this file remains to exercise @Import(library=...)
// and marks that app JS loaded and executed.
window.__hotelBookingJs = true;
