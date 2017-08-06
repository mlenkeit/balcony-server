'use strict';

const expect = require('chai').expect;

const avg = require('./../../../lib/util/avg');

describe('util/avg', function() {
  
  it('returns the average for an array of integers', function() {
    const inp = [1, 2, 3, 4, 67];
    const exp = (1 + 2 + 3 + 4 + 67) / inp.length;
    expect(avg(inp))
      .to.be.a('number')
      .and.to.equal(exp);
  });
  
  it('returns undefined for an empty array', function() {
    const inp = [];
    expect(avg(inp)).to.be.undefined;
  });
  
  it.skip('returns undefined for an array that contains non-numbers', function() {
    const inp = [1, 2, '3'];
    expect(avg(inp)).to.be.undefined;
  });
});