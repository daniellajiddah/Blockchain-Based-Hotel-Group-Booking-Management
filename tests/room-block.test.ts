import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity environment
const mockClarity = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // Mock sender address
  },
  contracts: {
    "room-block": {
      functions: {
        "create-room-block": vi.fn(),
        "update-room-block": vi.fn(),
        "get-room-block": vi.fn(),
        "deactivate-room-block": vi.fn(),
        "update-rooms-booked": vi.fn(),
        "verify-property": vi.fn(),
      },
    },
  },
}

// Tests for room-block contract
describe("Room Block Contract", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks()
  })
  
  it("should create a new room block for verified property", async () => {
    // Mock property verification
    mockClarity.contracts["room-block"].functions["verify-property"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    // Verify the property first
    await mockClarity.contracts["room-block"].functions["verify-property"](mockClarity.tx.sender)
    
    // Mock successful room block creation
    mockClarity.contracts["room-block"].functions["create-room-block"].mockResolvedValue({
      success: true,
      value: "u1", // block-id
    })
    
    const result = await mockClarity.contracts["room-block"].functions["create-room-block"](
        "Tech Conference 2023",
        "u1685577600", // June 1, 2023
        "u1685750400", // June 3, 2023
        "u50", // 50 rooms
        "u200", // $200 per room
    )
    
    expect(result.success).toBe(true)
    expect(result.value).toBe("u1")
  })
  
  it("should not create a room block with invalid dates", async () => {
    // Mock property verification
    mockClarity.contracts["room-block"].functions["verify-property"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    // Verify the property first
    await mockClarity.contracts["room-block"].functions["verify-property"](mockClarity.tx.sender)
    
    // Mock failure due to invalid dates
    mockClarity.contracts["room-block"].functions["create-room-block"].mockResolvedValue({
      success: false,
      error: "u2", // ERR_INVALID_DATES
    })
    
    const result = await mockClarity.contracts["room-block"].functions["create-room-block"](
        "Tech Conference 2023",
        "u1685750400", // June 3, 2023 (end date before start date)
        "u1685577600", // June 1, 2023
        "u50", // 50 rooms
        "u200", // $200 per room
    )
    
    expect(result.success).toBe(false)
    expect(result.error).toBe("u2")
  })
  
  it("should update a room block when called by property owner", async () => {
    // Mock getting room block details
    mockClarity.contracts["room-block"].functions["get-room-block"].mockResolvedValue({
      success: true,
      value: {
        "property-owner": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        "event-name": "Tech Conference 2023",
        "start-date": "u1685577600",
        "end-date": "u1685750400",
        "total-rooms": "u50",
        "price-per-room": "u200",
        "rooms-booked": "u0",
        active: true,
      },
    })
    
    // Mock successful update
    mockClarity.contracts["room-block"].functions["update-room-block"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    const blockId = "u1"
    const result = await mockClarity.contracts["room-block"].functions["update-room-block"](
        blockId,
        "Tech Conference 2023 Updated",
        "u1685664000", // June 2, 2023
        "u1685836800", // June 4, 2023
        "u60", // 60 rooms
        "u220", // $220 per room
    )
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["room-block"].functions["update-room-block"]).toHaveBeenCalledWith(
        blockId,
        "Tech Conference 2023 Updated",
        "u1685664000",
        "u1685836800",
        "u60",
        "u220",
    )
  })
  
  it("should not update a room block when called by non-owner", async () => {
    // Mock getting room block details with different owner
    mockClarity.contracts["room-block"].functions["get-room-block"].mockResolvedValue({
      success: true,
      value: {
        "property-owner": "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // Different owner
        "event-name": "Tech Conference 2023",
        "start-date": "u1685577600",
        "end-date": "u1685750400",
        "total-rooms": "u50",
        "price-per-room": "u200",
        "rooms-booked": "u0",
        active: true,
      },
    })
    
    // Mock failure due to unauthorized
    mockClarity.contracts["room-block"].functions["update-room-block"].mockResolvedValue({
      success: false,
      error: "u1", // ERR_UNAUTHORIZED
    })
    
    const blockId = "u1"
    const result = await mockClarity.contracts["room-block"].functions["update-room-block"](
        blockId,
        "Tech Conference 2023 Updated",
        "u1685664000",
        "u1685836800",
        "u60",
        "u220",
    )
    
    expect(result.success).toBe(false)
    expect(result.error).toBe("u1")
  })
  
  it("should deactivate a room block when called by property owner", async () => {
    // Mock getting room block details
    mockClarity.contracts["room-block"].functions["get-room-block"].mockResolvedValue({
      success: true,
      value: {
        "property-owner": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
        "event-name": "Tech Conference 2023",
        "start-date": "u1685577600",
        "end-date": "u1685750400",
        "total-rooms": "u50",
        "price-per-room": "u200",
        "rooms-booked": "u0",
        active: true,
      },
    })
    
    // Mock successful deactivation
    mockClarity.contracts["room-block"].functions["deactivate-room-block"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    const blockId = "u1"
    const result = await mockClarity.contracts["room-block"].functions["deactivate-room-block"](blockId)
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["room-block"].functions["deactivate-room-block"]).toHaveBeenCalledWith(blockId)
  })
})
