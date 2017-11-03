import React from 'react';
import { shallow, mount, render } from 'enzyme'; // eslint-disable-line
import expect from 'expect.js';
import Auth from '../index';

describe('Auth', () => {
    describe('render', () => {
        it('should render', () => {
            const wrapper = mount(<Auth />);
            expect(wrapper.props().prefix).to.equal('alife-bc-');
        });
    });
});
