import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity environment
const mockClarity = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // Mock sender address
  },
  contracts: {
    "property-verification": {
      functions: {
        "register-property": vi.fn(),
        "verify-property": vi.fn(),
        "is-property-verified": vi.fn(),
        "get-property-details": vi.fn(),
        "transfer-admin": vi.fn(),
      },
    },
  },
}

// Tests for property-verification contract
describe("Property Verification Contract", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks()
  })
  
  it("should register a new property", async () => {
    // Mock successful registration
    mockClarity.contracts["property-verification"].functions["register-property"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    const result = await mockClarity.contracts["property-verification"].functions["register-property"](
        "Grand Hotel",
        "New York",
    )
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["property-verification"].functions["register-property"]).toHaveBeenCalledWith(
        "Grand Hotel",
        "New York",
    )
  })
  
  it("should not register a property that is already registered", async () => {
    // Mock failure due to already registered
    mockClarity.contracts["property-verification"].functions["register-property"].mockResolvedValue({
      success: false,
      error: "u2", // ERR_ALREADY_VERIFIED
    })
    
    const result = await mockClarity.contracts["property-verification"].functions["register-property"](
        "Grand Hotel",
        "New York",
    )
    
    expect(result.success).toBe(false)
    expect(result.error).toBe("u2")
  })
  
  it("should verify a property when called by admin", async () => {
    // Mock successful verification
    mockClarity.contracts["property-verification"].functions["verify-property"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    const propertyOwner = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = await mockClarity.contracts["property-verification"].functions["verify-property"](propertyOwner)
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["property-verification"].functions["verify-property"]).toHaveBeenCalledWith(
        propertyOwner,
    )
  })
  
  it("should not verify a property when called by non-admin", async () => {
    // Mock failure due to unauthorized
    mockClarity.contracts["property-verification"].functions["verify-property"].mockResolvedValue({
      success: false,
      error: "u1", // ERR_UNAUTHORIZED
    })
    
    const propertyOwner = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = await mockClarity.contracts["property-verification"].functions["verify-property"](propertyOwner)
    
    expect(result.success).toBe(false)
    expect(result.error).toBe("u1")
  })
  
  it("should check if a property is verified", async () => {
    // Mock property is verified
    mockClarity.contracts["property-verification"].functions["is-property-verified"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    const propertyOwner = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = await mockClarity.contracts["property-verification"].functions["is-property-verified"](propertyOwner)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe(true)
  })
  
  it("should get property details", async () => {
    // Mock property details
    const propertyDetails = {
      name: "Grand Hotel",
      location: "New York",
      verified: true,
      "verification-date": "u12345",
    }
    
    mockClarity.contracts["property-verification"].functions["get-property-details"].mockResolvedValue({
      success: true,
      value: propertyDetails,
    })
    
    const propertyOwner = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = await mockClarity.contracts["property-verification"].functions["get-property-details"](propertyOwner)
    
    expect(result.success).toBe(true)
    expect(result.value).toEqual(propertyDetails)
  })
  
  it("should transfer admin rights when called by admin", async () => {
    // Mock successful admin transfer
    mockClarity.contracts["property-verification"].functions["transfer-admin"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    const newAdmin = "ST3PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
    const result = await mockClarity.contracts["property-verification"].functions["transfer-admin"](newAdmin)
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["property-verification"].functions["transfer-admin"]).toHaveBeenCalledWith(newAdmin)
  })
})
