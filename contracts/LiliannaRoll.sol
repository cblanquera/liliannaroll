// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./ERC721Base.sol";
import "./ERC721Collections.sol";

contract LiliannaRoll is ERC721Base, ERC721Collections, ReentrancyGuard {
  using Strings for uint256;
  using SafeMath for uint256;

  /**
   * @dev Sets up ERC721Base. Sets contract URI
   */
  constructor(string memory uri) ERC721Base("Lilanna Roll", "LRC") {
    _setContractURI(uri);
  }

  /**
   * @dev Allows anyone to get a token that was approved by the contract owner
   */
  function authorize(uint256 collectionId, bytes memory proof) 
    public virtual 
  {
    authorizeFor(collectionId, _msgSender(), proof);
  }

  /**
   * @dev Allows anyone to get a token that was approved by the contract owner
   */
  function authorizeFor(
    uint256 collectionId, 
    address recipient, 
    bytes memory proof
  ) public virtual nonReentrant {
    //check size
    require(!collectionFilled(collectionId), "Collection filled");
    //make sure the minter signed this off
    require(hasRole(MINTER_ROLE, ECDSA.recover(
      ECDSA.toEthSignedMessageHash(
        keccak256(abi.encodePacked(collectionId, recipient))
      ),
      proof
    )), "Invalid proof.");
    //mint first and wait for errors
    _safeMint(recipient);
    //then classify it
    _group(lastId(), collectionId);
  }

  /**
   * @dev Allows anyone to purchase a token
   */
  function buy(uint256 collectionId) public virtual payable {
    buyFor(collectionId, _msgSender());
  }

  /**
   * @dev Allows anyone to purchase a token for someone
   */
  function buyFor(uint256 collectionId, address recipient) 
    public virtual payable nonReentrant 
  {
    //check size
    require(!collectionFilled(collectionId), "Collection filled");
    //the value sent should be the price times quantity
    require(
      collectionOffer(collectionId) <= msg.value, 
      "Amount sent is not correct"
    );
  
    //mint first and wait for errors
    _safeMint(recipient);
    //then classify it
    _group(lastId(), collectionId);
  }

  /**
   * @dev Allows admin to mint a token for someone
   */
  function mint(uint256 collectionId, address recipient) 
    public virtual onlyRole(MINTER_ROLE) 
  {
    //check size
    require(!collectionFilled(collectionId), "Collection filled");
    //mint first and wait for errors
    _safeMint(recipient);
    //then classify it
    _group(lastId(), collectionId);
  }

  /**
   * @dev Override
   */
  function tokenURI(uint256 tokenId) 
    public 
    view 
    virtual 
    override(ERC721, ERC721Collections) 
    returns(string memory) 
  {
    return super.tokenURI(tokenId);
  }

  function makeCollection(
    uint256 collectionId, 
    uint256 size, 
    uint256 offer, 
    string memory uri, 
    bool fixedURI
  ) public virtual onlyRole(CURATOR_ROLE) {
    if (size > 0) {
      fixCollectionSize(collectionId, size);
    }

    if (offer > 0) {
      makeCollectionOffer(collectionId, offer);
    }

    if (bytes(uri).length > 0) {
      if (fixedURI) {
        setCollectionFixedURI(collectionId, uri);
      } else {
        setCollectionBaseURI(collectionId, uri);
      }
    }
  }

  /**
   * @dev Registers a max `size` for a `collectionId`
   */
  function fixCollectionSize(uint256 collectionId, uint256 size) 
    public virtual onlyRole(CURATOR_ROLE) 
  {
    _fixCollectionSize(collectionId, size);
  }

  /**
   * @dev Sets an initial `offer` for a `collectionId`
   */
  function makeCollectionOffer(uint256 collectionId, uint256 offer) 
    public virtual onlyRole(CURATOR_ROLE) 
  {
    _makeCollectionOffer(collectionId, offer);
  }

  /**
   * @dev Sets a base `uri` for a `collectionId`
   */
  function setCollectionBaseURI(uint256 collectionId, string memory uri) 
    public virtual onlyRole(CURATOR_ROLE) 
  {
    _setCollectionBaseURI(collectionId, uri);
  }

  /**
   * @dev Sets a fixed `uri` for a `collectionId`
   */
  function setCollectionFixedURI(uint256 collectionId, string memory uri) 
    public virtual onlyRole(CURATOR_ROLE) 
  {
    _setCollectionFixedURI(collectionId, uri);
  }

  /**
   * @dev Allows the proceeds to be withdrawn
   */
  function withdraw() external virtual onlyRole(DEFAULT_ADMIN_ROLE) {
    uint balance = address(this).balance;
    payable(_msgSender()).transfer(balance);
  }

  /**
   * @dev Override.
   */
  function _exists(uint256 tokenId) 
    internal 
    view 
    virtual 
    override(ERC721, ERC721Collections) 
    returns (bool) 
  {
    return super._exists(tokenId);
  }
}