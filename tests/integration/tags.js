'use strict';
var chai = require( 'chai' );
// Variable to use as our "success token" in promise assertions
var SUCCESS = 'success';
// Chai-as-promised and the `expect( prom ).to.eventually.equal( SUCCESS ) is
// used to ensure that the assertions running within the promise chains are
// actually run.
chai.use( require( 'chai-as-promised' ) );
var expect = chai.expect;

var WP = require( '../../' );
var WPRequest = require( '../../lib/shared/wp-request.js' );

// Define some arrays to use ensuring the returned data is what we expect
// it to be (e.g. an array of the names from tags on the first page)
var expectedResults = {
	names: {
		page1: [
			'8BIT',
			'alignment',
			'Articles',
			'aside',
			'audio',
			'captions',
			'categories',
			'chat',
			'chattels',
			'cienaga'
		],
		page2: [
			'claycold',
			'Codex',
			'comments',
			'content',
			'crushing',
			'css',
			'depo',
			'dinarchy',
			'doolie',
			'dowork'
		],
		pageLast: [
			'trackbacks',
			'twitter',
			'unculpable',
			'Unseen',
			'video',
			'videopress',
			'withered brandnew',
			'WordPress',
			'wordpress.tv',
			'xanthopsia'
		]
	}
};

// Inspecting the titles of the returned tags arrays is an easy way to
// validate that the right page of results was returned
function getNames( tags ) {
	return tags.map(function( category ) {
		return category.name;
	});
}

describe( 'integration: tags()', function() {
	var wp;

	beforeEach(function() {
		wp = new WP({
			endpoint: 'http://wpapi.loc/wp-json'
		});
	});

	it( 'can be used to retrieve a collection of category terms', function() {
		var prom = wp.tags().get().then(function( tags ) {
			expect( tags ).to.be.an( 'array' );
			expect( tags.length ).to.equal( 10 );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	it( 'retrieves the first 10 tags by default', function() {
		var prom = wp.tags().get().then(function( tags ) {
			expect( tags ).to.be.an( 'array' );
			expect( tags.length ).to.equal( 10 );
			return SUCCESS;
		});
		return expect( prom ).to.eventually.equal( SUCCESS );
	});

	describe( 'paging properties', function() {

		it( 'are exposed as _paging on the response array', function() {
			var prom = wp.tags().get().then(function( tags ) {
				expect( tags ).to.have.property( '_paging' );
				expect( tags._paging ).to.be.an( 'object' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of tags', function() {
			var prom = wp.tags().get().then(function( tags ) {
				expect( tags._paging ).to.have.property( 'total' );
				expect( tags._paging.total ).to.equal( '110' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'include the total number of pages available', function() {
			var prom = wp.tags().get().then(function( tags ) {
				expect( tags._paging ).to.have.property( 'totalPages' );
				expect( tags._paging.totalPages ).to.equal( '11' );
				return SUCCESS;
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the next page as .next', function() {
			var prom = wp.tags().get().then(function( tags ) {
				expect( tags._paging ).to.have.property( 'next' );
				expect( tags._paging.next ).to.be.an( 'object' );
				expect( tags._paging.next ).to.be.an.instanceOf( WPRequest );
				expect( tags._paging.next._options.endpoint ).to
					.equal( 'http://wpapi.loc/wp-json/wp/v2/tags?page=2' );
				// Get last page & ensure "next" no longer appears
				return wp.tags().page( tags._paging.totalPages ).get().then(function( tags ) {
					expect( tags._paging ).not.to.have.property( 'next' );
					expect( getNames( tags ) ).to.deep.equal( expectedResults.names.pageLast );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the next page of results via .next', function() {
			var prom = wp.tags().get().then(function( tags ) {
				return tags._paging.next.get().then(function( tags ) {
					expect( tags ).to.be.an( 'array' );
					expect( tags.length ).to.equal( 10 );
					expect( getNames( tags ) ).to.deep.equal( expectedResults.names.page2 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'provides a bound WPRequest for the previous page as .prev', function() {
			var prom = wp.tags().get().then(function( tags ) {
				expect( tags._paging ).not.to.have.property( 'prev' );
				return tags._paging.next.get().then(function( tags ) {
					expect( tags._paging ).to.have.property( 'prev' );
					expect( tags._paging.prev ).to.be.an( 'object' );
					expect( tags._paging.prev ).to.be.an.instanceOf( WPRequest );
					expect( tags._paging.prev._options.endpoint ).to
						.equal( 'http://wpapi.loc/wp-json/wp/v2/tags?page=1' );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

		it( 'allows access to the previous page of results via .prev', function() {
			var prom = wp.tags().page( 2 ).get().then(function( tags ) {
				expect( getNames( tags ) ).to.deep.equal( expectedResults.names.page2 );
				return tags._paging.prev.get().then(function( tags ) {
					expect( tags ).to.be.an( 'array' );
					expect( tags.length ).to.equal( 10 );
					expect( getNames( tags ) ).to.deep.equal( expectedResults.names.page1 );
					return SUCCESS;
				});
			});
			return expect( prom ).to.eventually.equal( SUCCESS );
		});

	});

});
