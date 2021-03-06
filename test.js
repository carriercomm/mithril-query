'use strict';

var m = require('mithril');
var mq = require('./');
var keyCode = require('yields-keycode');
var expect = require('expect.js');

function noop() {}

describe('mithril query', function() {
  describe('basic selection of things', function() {
    var el, out, tagEl, concatClassEl, classEl, idEl, innerString;
    var devilEl, idClassEl, arrayOfArrays, rawHtml, numbah, disabled;
    var msxOutput;

    beforeEach(function() {
      tagEl = m('span');
      concatClassEl = m('.onetwo');
      classEl = m('.one.two');
      idEl = m('#two');
      innerString = 'Inner String';
      devilEl = m('.three', 'DEVIL');
      idClassEl = m('#three.three');
      arrayOfArrays = m('#arrayArray');
      disabled = m('[disabled]');
      rawHtml = m.trust('<div class="trusted"></div>');
      msxOutput = { tag: 'div', attrs: { class: 'msx' }, children: [] };
      numbah = 10;
      el = m('.root', [tagEl, concatClassEl, classEl, innerString, idEl,
                         devilEl, idClassEl, [[arrayOfArrays]], undefined,
                         numbah, rawHtml, disabled, msxOutput]);
      out = mq(el);
    });
    it('should allow to select by selectors', function() {
      expect(out.first('span')).to.eql(tagEl);
      expect(out.first('.one')).to.eql(classEl);
      expect(out.first('div > .one')).to.eql(classEl);
      expect(out.first('.two.one')).to.eql(classEl);
      expect(out.first('#two')).to.eql(idEl);
      expect(out.first('div#two')).to.eql(idEl);
      expect(out.first('.three#three')).to.eql(idClassEl);
      expect(out.first(':contains(DEVIL)')).to.eql(devilEl);
      expect(out.first('#arrayArray')).to.eql(arrayOfArrays);
      expect(out.first(':contains(Inner String)').attrs.className).to.eql('root');
      expect(out.first('[disabled]')).to.eql(disabled);
      expect(out.first('.msx')).to.eql(msxOutput);
    });
  });

  describe('events', function() {
    var out, events, eventEl;
    beforeEach(function() {
      events = {
        onclick: noop,
        onfocus: noop
      };
      eventEl = m('input#eventEl', {
        onclick: function(evt) { events.onclick(evt); },
        onfocus: function(evt) { events.onfocus(evt); },
        oninput: function(evt) { events.oninput(evt); },
        onthing: function(evt) { events.onthing(evt); }
      });
      out = mq(m('.root', eventEl));
    });

    it('should react on click events', function(done) {
      events.onclick = function() {
        done();
      };
      out.click('#eventEl');
    });

    it('should react on focus events', function(done) {
      events.onfocus = function() {
        done();
      };
      out.focus('#eventEl');
    });

    it('should react on input events', function(done) {
      events.oninput = function(event) {
        expect(event.target.value).to.be('huhu');
        expect(event.currentTarget.value).to.be('huhu');
        done();
      };
      out.setValue('#eventEl', 'huhu');
    });

    it('should allow sending custom events', function(done) {
      events.onthing = function(event) {
        expect(event).to.be('pop');
        done();
      };
      out.trigger('#eventEl', 'thing', 'pop');
    });
  });

  describe('contains', function() {
    it('should allow to select by content', function() {
      var out = mq(m('.containstest', ['Inner String', null, 123]));
      expect(out.contains('Inner String')).to.be.ok();
      expect(out.contains(123)).to.ok();
    });

    describe('trusted content', function() {
      it('should allow to select by content', function() {
        var out = mq(m('.containstest', [m.trust('<p>Trusted String</p>'), 'Inner String']));
        expect(out.contains('Inner String')).to.be.ok();
        expect(out.contains('Trusted String')).to.be.ok();
      });
    });
  });
});

describe('should style assertions', function() {
  var out;

  beforeEach(function() {
    out = mq(m('.shouldtest', [
      m('span'),
      m('.one'),
      m('.two', 'XXXXX'),
    ]));
  });

  it('should not throw when as expected', function() {
    expect(out.should.have).withArgs('span').to.not.throwError();
    expect(out.should.have).withArgs('.one').to.not.throwError();
  });

  it('should throw when no element matches', function() {
    expect(out.should.have).withArgs('table').to.throwError();
  });

  it('should throw when count is not exact', function() {
    expect(out.should.have).withArgs(100, 'div').to.throwError();
  });

  it('should throw when count is exact', function() {
    expect(out.should.have).withArgs(3, 'div').to.not.throwError();
  });

  it('should throw when not containing sting', function() {
    expect(out.should.contain).withArgs('XXXXX').to.not.throwError();
  });

  it('should not throw when expecting unpresence of unpresent', function() {
    expect(out.should.not.have).withArgs('table').to.not.throwError();
  });

  it('should throw when expecting unpresence of present', function() {
    expect(out.should.not.have).withArgs('span').to.throwError();
  });

  it('should throw when containing unexpected sting', function() {
    expect(out.should.not.contain).withArgs('XXXXX').to.throwError();
  });

  it('should throw when containing unexpected sting', function() {
    expect(out.should.not.contain).withArgs('FOOOO').to.not.throwError();
  });
  it('should not throw when there are enought elements', function() {
    expect(out.should.have.at.least).withArgs(3, 'div').to.not.throwError();
  });
  it('should throw when not enought elements', function() {
    expect(out.should.have.at.least).withArgs(40000, 'div').to.throwError();
  });
});

describe('null objects', function() {
  it('should ignore null objects', function() {
    function view() {
      return m('div', [
        null,
        m('input'),
        null
      ]);
    }
    mq(view).should.have('input');
    expect(mq(view()).should.have).withArgs('input').to.not.throwError();
  });
});

describe('autorender', function() {
  describe('autorerender module', function() {
    var out;

    beforeEach(function() {
      var module = {
        controller: function() {
          var scope = {
            visible: true,
            toggleMe: function() { scope.visible = !scope.visible; }
          };
          return scope;
        },
        view: function(scope) {
          return m(scope.visible ? '.visible' : '.hidden', {
            onclick: scope.toggleMe
          }, 'Test');
        }
      };
      out = mq(module);
    });

    it('should autorender', function() {
      out.should.have('.visible');
      out.click('.visible');
      out.should.have('.hidden');
      out.click('.hidden', null, true);
      out.should.have('.hidden');
    });

    it('should update boolean attributes', function() {
      out = mq(function() {
        return m('select', [
          m('option', {value: 'foo', selected: true})
        ]);
      });
      out.should.have('option[selected]');
    });
  });

  describe('autorerender function', function() {
    it('should autorender function', function() {
      function view(scope) {
        return m(scope.visible ? '.visible' : '.hidden', {
          onclick: function() { scope.visible = !scope.visible; }
        }, 'Test');
      }

      var scope = { visible: true };
      var out = mq(view, scope);
      out.should.have('.visible');
      out.click('.visible');
      out.should.have('.hidden');
      out.click('.hidden', null, true);
      out.should.have('.hidden');
    });
  });
});

describe('access root element', function() {
  it('should be possible to access root element', function() {
    function view() {
      return m('div', ['foo', 'bar']);
    }
    var out = mq(view);
    expect(out.rootEl).to.eql({
      attrs: {},
      children: [ 'foo', 'bar' ],
      tag: 'div'
    });
  });
});

describe('trigger keyboard events', function() {
  it('should be possible to describe keyboard events', function() {
    var module = {
      controller: function() {
        var scope = {
          visible: true,
          update: function(event) {
            if (event.keyCode == 123) scope.visible = false;
            if (event.keyCode == keyCode('esc')) scope.visible = true;
          }
        };
        return scope;
      },
      view: function(scope) {
        return m(scope.visible ? '.visible' : '.hidden', {
          onkeydown: scope.update
        }, 'describe');
      }
    };
    var out = mq(module);
    out.keydown('div', 'esc');
    out.should.have('.visible');
    out.keydown('div', 123);
    out.should.have('.hidden');
  });
});

describe('onunload', function() {
  it('should be possible when init with view, scope', function(done) {
    function view() {}
    var scope = {
      onunload: done
    };
    var out = mq(view, scope);
    out.onunload();
  });
  it('should be possible when init with rendered view', function() {
    function view() {
      return 'foo';
    }
    var out = mq(view());
    expect(out.onunload).to.not.throwError;
  });
  it('should be possible when init with module', function(done) {
    var module = {
      view: function() {},
      controller: function() {
        return {
          onunload: done
        };
      }
    };
    var out = mq(module);
    out.onunload();
  });
});

describe('components', function() {
  var out, events = {onunload: noop};
  var myComponent = {
    controller: function(data) {
      return {
        foo: data || 'bar',
        onunload: function() {
          events.onunload();
        },
        firstRender: true
      };
    },
    view: function(scope, data) {
      var tag = 'aside';
      if (scope.firstRender) {
        tag += '.firstRender';
        scope.firstRender = false;
      }
      return m(tag, [
        data,
        'hello',
        scope.foo
      ]);
    }
  };

  describe('basic usage', function() {
    it('should work with components', function() {
      out = mq(m('div', {
        controller: noop,
        view: function() {
          return m('strong', 'bar');
        }
      }));
      out.should.have('strong');
      out.should.contain('bar');
    });
  });

  describe('use with m.component', function() {
    it('should work with presetted components', function() {
      out = mq(m('span', m.component({
        controller: noop,
        view: function(scope, data) {
          return m('aside', data);
        }
      }), 'huhu'));
      out.should.have('aside');
      out.should.contain('huhu');
    });
  });

  describe('describe plain component with init args', function() {
    it('should work with directly injected components', function() {
      out = mq(myComponent, 'huhu');
      out.should.have('aside');
      out.should.contain('huhu');
    });
  });

  describe('describe onunload', function() {
    it('should call onunload', function(done) {
      events.onunload = done;
      out = mq(m('div', m.component(myComponent, 'huhu')));
      out.should.have('aside');
      out.onunload();
    });
  });

  describe('state', function() {
    it('should preserve components state', function() {
      events.onunload = noop;
      out = mq(m('div', m.component(myComponent, 'haha')));
      out.should.have('aside.firstRender');
      out.redraw();
      out.should.not.have('aside.firstRender');
    });
  });

  describe('state with multiple of same elements', function() {
    it('should preserve components state for every used component', function() {
      events.onunload = noop;
      out = mq(m('div', [
        myComponent,
        myComponent
      ]));
      out.should.have(2, 'aside.firstRender');
      out.redraw();
      out.should.not.have('aside.firstRender');
    });
  });

  describe('describe onunload component only', function() {
    it('should call onunload', function(done) {
      out = mq({
        controller: function() {
          return { onunload: done };
        },
        view: function() {
          return m('aside', 'bar');
        }
      });
      out.should.have('aside');
      out.onunload();
    });
  });
});
