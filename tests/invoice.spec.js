/* eslint-env mocha */

import xml2js from 'xml2js'
const parser = new xml2js.Parser()
import { expect } from 'chai'

import { Buyer, Invoice, Item, Seller } from '../index.js'
import { createSeller, createBuyer, createSoldItemNet, createSoldItemGross, createInvoice } from './resources/setup.js'
import { Currency, Language, PaymentMethod } from "../lib/Constants.js"

describe('Invoice', function () {
  let seller
  let buyer
  let soldItem1
  let soldItem2
  let invoice

  beforeEach(function () {
    seller = createSeller(Seller)
    buyer = createBuyer(Buyer)
    soldItem1 = createSoldItemNet(Item)
    soldItem2 = createSoldItemGross(Item)
    invoice = createInvoice(Invoice, seller, buyer, [soldItem1, soldItem2])
  })

  describe('constructor', function () {
    it('should set _options property', function () {
      expect(invoice).to.have.property('_options').that.is.an('object')
    })

    it('should set seller', function () {
      expect(invoice._options).to.have.property('seller').to.be.an.instanceof(Seller)
    })

    it('should set buyer', function () {
      expect(invoice._options).to.have.property('buyer').to.be.an.instanceof(Buyer)
    })

    it('should set items', function () {
      expect(invoice._options).to.have.property('items').that.is.an('array')
    })
  })
  describe('_generateXML', function () {
    it('should return valid XML', function (done) {
      parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
        expect(result).to.have.property('wrapper').that.is.an('object')
        done()
      })
    })

    describe('generated XML', function () {
      let obj

      beforeEach(function (done) {
        parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
          if (!err) obj = result.wrapper

          done()
        })
      })

      it('should have `fejlec` node', function () {
        expect(obj).to.have.property('fejlec')
      })

      it('should have `elado` node', function () {
        expect(obj).to.have.property('elado')
      })

      it('should have `vevo` node', function () {
        expect(obj).to.have.property('vevo')
      })

      it('should have `tetelek` node', function () {
        expect(obj).to.have.property('tetelek')
      })

      // START- New test suite for adjustmentInvoiceNumber property
      describe('adjustmentInvoiceNumber validation', function () {
        it('should not include adjustmentInvoiceNumber when it is null', function (done) {
          const invoice = new Invoice({
            adjustmentInvoiceNumber: null,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
            expect(result.wrapper).to.not.have.deep.property('fejlec.helyesbitettSzamlaszam');
            expect(result.wrapper).to.not.have.deep.property('fejlec.helyesbitoszamla');
            done(err);
          });
        });

        it('should not include adjustmentInvoiceNumber when it is undefined', function (done) {
          const invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
            expect(result.wrapper).to.not.have.deep.property('fejlec.helyesbitettSzamlaszam');
            expect(result.wrapper).to.not.have.deep.property('fejlec.helyesbitoszamla');
            done(err);
          });
        });

        it('should throw an error when adjustmentInvoiceNumber is an empty string', function () {
          expect(() => {
            invoice = new Invoice({
              adjustmentInvoiceNumber: '',
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
            });
            invoice._generateXML();
          }).to.throw(/"adjustmentInvoiceNumber" should be minimum 1 character/);
        });

        it('should throw an error when adjustmentInvoiceNumber is a Date object', function () {

          expect(() => {
            invoice = new Invoice({
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
              adjustmentInvoiceNumber: new Date()
            });
            invoice._generateXML();
          }).to.throw(/"adjustmentInvoiceNumber" should be a string/);
        });

        it('should throw an error when adjustmentInvoiceNumber is a number', function () {
          invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            adjustmentInvoiceNumber: 123
          });
          expect(() => {
            invoice._generateXML();
          }).to.throw(/"adjustmentInvoiceNumber" should be a string/);
        });

        it('should throw an error when adjustmentInvoiceNumber is a boolean', function () {
          const invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            adjustmentInvoiceNumber: true
          });
          expect(() => {
            invoice._generateXML();
          }).to.throw(/"adjustmentInvoiceNumber" should be a string/);
        });

        it('should not throw an error when adjustmentInvoiceNumber is a non-empty string', function () {
          expect(() => {
            const invoice = new Invoice({
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
              adjustmentInvoiceNumber: '12345'
            });
            invoice._generateXML();
          }).to.not.throw();
        });

        it('should include adjustmentInvoiceNumber when it is a non-empty string', function (done) {
          const invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            adjustmentInvoiceNumber: '12345'
          });
          parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
            expect(result.wrapper.fejlec[0].helyesbitettSzamlaszam[0]).to.equal('12345');
            expect(result.wrapper.fejlec[0].helyesbitoszamla[0]).to.equal('true');
            done(err);
          });
        });
      });
      // END - New test suite for adjustmentInvoiceNumber property

      describe('prepaymentInvoiceNumber validation', function () {
        it('should throw an error when finalInvoice is not set', function () {
          expect(() => {
            invoice = new Invoice({
              prepaymentInvoiceNumber: '1234',
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
            });
            invoice._generateXML();
          }).to.throw(/"prepaymentInvoiceNumber" should only be set if "finalInvoice" is true/);
        });

        it('should throw an error when finalInvoice is false', function () {
          expect(() => {
            invoice = new Invoice({
              finalInvoice: false,
              prepaymentInvoiceNumber: '1234',
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
            });
            invoice._generateXML();
          }).to.throw(/"prepaymentInvoiceNumber" should only be set if "finalInvoice" is true/);
        });

        it('should throw an error when prepaymentInvoiceNumber is an empty string', function () {
          expect(() => {
            invoice = new Invoice({
              prepaymentInvoiceNumber: '',
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
            });
            invoice._generateXML();
          }).to.throw(/"prepaymentInvoiceNumber" should be minimum 1 character/);
        });

        it('should throw an error when prepaymentInvoiceNumber is a Date object', function () {
          expect(() => {
            invoice = new Invoice({
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
              prepaymentInvoiceNumber: new Date()
            });
            invoice._generateXML();
          }).to.throw(/"prepaymentInvoiceNumber" should be a string/);
        });

        it('should throw an error when prepaymentInvoiceNumber is a number', function () {
          invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            prepaymentInvoiceNumber: 123
          });
          expect(() => {
            invoice._generateXML();
          }).to.throw(/"prepaymentInvoiceNumber" should be a string/);
        });

        it('should throw an error when prepaymentInvoiceNumber is a boolean', function () {
          const invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            prepaymentInvoiceNumber: true
          });
          expect(() => {
            invoice._generateXML();
          }).to.throw(/"prepaymentInvoiceNumber" should be a string/);
        });

        it('should not throw an error when prepaymentInvoiceNumber is a non-empty string and finalInvoice is true', function () {
          expect(() => {
            const invoice = new Invoice({
              paymentMethod: PaymentMethod.BankTransfer,
              currency: Currency.Ft,
              language: Language.Hungarian,
              seller: seller,
              buyer: buyer,
              items: [soldItem1, soldItem2],
              finalInvoice: true,
              prepaymentInvoiceNumber: '12345'
            });
            invoice._generateXML();
          }).to.not.throw();
        });

        it('should include prepaymentInvoiceNumber when it is a non-empty string and finalInvoice is true', function (done) {
          const invoice = new Invoice({
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
            finalInvoice: true,
            prepaymentInvoiceNumber: '12345'
          });
          parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
            expect(result.wrapper.fejlec[0].elolegSzamlaszam[0]).to.equal('12345');
            done(err);
          });
        });
      });

      describe('NAV reporting', function () {
        it('should not include noNavReport when it is null.', function (done) {
          const invoice = new Invoice({
            noNavReport: null,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
            expect(result.wrapper).to.not.have.deep.property('fejlec.eusAfa');
            done(err);
          });
        });

        it('should not include noNavReport when it is undefined.', function (done) {
          const invoice = new Invoice({
            noNavReport: undefined,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
            expect(result.wrapper).to.not.have.deep.property('fejlec.eusAfa');
            done(err);
          });
        });

        it('should set eusAfa to true when noNavReport = true', function (done) {
          const invoice = new Invoice({
            noNavReport: true,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
            // it returns with string true because the xml parser parse it as string
            expect(result.wrapper.fejlec[0].eusAfa).to.deep.equal(['true']);
            done(err);
          });
        });

        it('should set eusAfa to false when noNavReport = false', function (done) {
          const invoice = new Invoice({
            noNavReport: false,
            paymentMethod: PaymentMethod.BankTransfer,
            currency: Currency.Ft,
            language: Language.Hungarian,
            seller: seller,
            buyer: buyer,
            items: [soldItem1, soldItem2],
          });

          parser.parseString('<wrapper>' + invoice._generateXML() + '</wrapper>', function (err, result) {
            // it returns with string true because the xml parser parse it as string
            expect(result.wrapper.fejlec[0].eusAfa).to.deep.equal(['false']);
            done(err);
          });
        });
      })
    });
  });
});
