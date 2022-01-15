// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @dev Abstract implementation of a multi collection token factory
 */
abstract contract ERC721Collections {
  using Strings for uint256;
  
  //mapping of token id to collection id
  mapping(uint256 => uint256) private _tokens;
  //mapping of token id to indexes
  mapping(uint256 => uint256) private _indexes;
  //index mapping of collection id to current supply size
  mapping(uint256 => uint256) private _supply;
  //mapping of collection id to total supply size
  mapping(uint256 => uint256) private _size;
  //mapping of collection id to base uri
  mapping(uint256 => string) private _baseURIs;
  //mapping of collection id to fixed uri
  mapping(uint256 => string) private _fixedURIs;
  //mapping of collection id to inital offers
  mapping(uint256 => uint256) private _offers;

  /**
   * @dev Returns whether `tokenId` exists.
   */
  function _exists(uint256 tokenId) internal view virtual returns (bool);

  /**
   * @dev Returns the collection given `tokenId`
   */
  function collectionOf(uint256 tokenId) 
    public view virtual returns(uint256) 
  {
    require(_exists(tokenId), "Token does not exist");
    return _tokens[tokenId];
  }

  /**
   * @dev Returns the base URI of a collection 
   */
  function collectionBaseURI(uint256 collectionId) 
    public view virtual returns(string memory) 
  {
    return _baseURIs[collectionId];
  }

  /**
   * @dev Returns the fixed URI of a collection 
   */
  function collectionFixedURI(uint256 collectionId) 
    public view virtual returns(string memory) 
  {
    return _fixedURIs[collectionId];
  }

  /**
   * @dev Returns true if `collectionId` supply and size are equal
   */
  function collectionFilled(uint256 collectionId) 
    public view virtual returns(bool) 
  {
    return _size[collectionId] != 0 && _supply[collectionId] == _size[collectionId];
  }

  /**
   * @dev Returns the initial offer of a `collectionId`
   */
  function collectionOffer(uint256 collectionId) 
    public view virtual returns(uint256) 
  {
    return _offers[collectionId];
  }

  /**
   * @dev Returns the token URI by using the base uri and index
   */
  function tokenURI(uint256 tokenId) 
    public view virtual returns(string memory) 
  {
    //make sure token exists
    require(_exists(tokenId), "Token does not exist");
    //get collection id
    uint256 collectionId = collectionOf(tokenId);
    //make sure there is a collection
    require(collectionId > 0, "Token does not have a collection");
    //if there is a fixed uri
    if (bytes(_fixedURIs[collectionId]).length > 0) {
      //use that
      return _fixedURIs[collectionId];
    }
    //if there is a base uri
    if (bytes(_baseURIs[collectionId]).length > 0) {
      //use that
      //ex. https://ipfs.io/ipfs/Qm123abc/ + 0 + .json
      return string(
        abi.encodePacked(
          _baseURIs[collectionId], 
          _indexes[tokenId].toString(), 
          ".json"
        )
      );
    }
    //not sure what to return ...
    return "";
  }

  /**
   * @dev Returns the total possible supply size of `collectionId`
   */
  function collectionSize(uint256 collectionId) 
    public view virtual returns(uint256) 
  {
    return _size[collectionId];
  }

  /**
   * @dev Returns the current supply size of `collectionId`
   */
  function collectionSupply(uint256 collectionId) 
    public view virtual returns(uint256) 
  {
    return _supply[collectionId];
  }

  /**
   * @dev Maps `tokenId` to `collectionId`
   */
  function _group(uint256 tokenId, uint256 collectionId) 
    internal virtual 
  {
    require(_exists(tokenId), "Token does not exist");
    require(_tokens[tokenId] == 0, "Token is already grouped");
    require(!collectionFilled(collectionId), "Collection size exceeded");
    //add token to collection
    _tokens[tokenId] = collectionId;
    //assign an index to the token
    _indexes[tokenId] = _supply[collectionId];
    //add to the supply
    _supply[collectionId] += 1;
  }

  /**
   * @dev Sets an immutable fixed `size` to `collectionId`
   */
  function _fixCollectionSize(uint256 collectionId, uint256 size) 
    internal virtual 
  {
    require (
      _size[collectionId] == 0,
      "Collection is already sized"
    );
    _size[collectionId] = size;
  }

  /**
   * @dev Sets a base `uri` for `collectionId`
   */
  function _setCollectionBaseURI(uint256 collectionId, string memory uri) 
    internal virtual 
  {
    _baseURIs[collectionId] = uri;
  }

  /**
   * @dev Sets a fixed `uri` for `collectionId`
   */
  function _setCollectionFixedURI(uint256 collectionId, string memory uri) 
    internal virtual 
  {
    _fixedURIs[collectionId] = uri;
  }

  /**
   * @dev Sets an `offer` amount for `collectionId`
   */
  function _makeCollectionOffer(uint256 collectionId, uint256 offer) 
    internal virtual 
  {
    _offers[collectionId] = offer;
  }
}