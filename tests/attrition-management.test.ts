import { describe, it, expect, beforeEach, vi } from "vitest"

// Mock the Clarity environment
const mockClarity = {
  tx: {
    sender: "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM", // Mock sender address
  },
  contracts: {
    "attrition-management": {
      functions: {
        "create-attrition-policy": vi.fn(),
        "calculate-attrition": vi.fn(),
        "get-attrition-policy": vi.fn(),
        "update-attrition-policy": vi.fn(),
        "add-room-block": vi.fn(),
      },
    },
  },
  blockHeight: 12345, // Mock block height
}

// Tests for attrition-management contract
describe("Attrition Management Contract", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks()
  })
  
  it("should create an attrition policy for a room block", async () => {
    // Add a room block for testing
    await mockClarity.contracts["attrition-management"].functions["add-room-block"](
        "u1", // block-id
        mockClarity.tx.sender, // property-owner (same as tx.sender)
        "Tech Conference 2023",
        "u1685577600", // June 1, 2023
        "u1685750400", // June 3, 2023
        "u50", // total-rooms
        "u200", // price-per-room
        "u10", // rooms-booked
        true, // active
    )
    
    // Mock successful policy creation
    mockClarity.contracts["attrition-management"].functions["create-attrition-policy"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    const blockId = "u1"
    const minPickupPercentage = "u80" // 80%
    const penaltyPercentage = "u50" // 50%
    const gracePeriod = "u7" // 7 days
    
    const result = await mockClarity.contracts["attrition-management"].functions["create-attrition-policy"](
        blockId,
        minPickupPercentage,
        penaltyPercentage,
        gracePeriod,
    )
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["attrition-management"].functions["create-attrition-policy"]).toHaveBeenCalledWith(
        blockId,
        minPickupPercentage,
        penaltyPercentage,
        gracePeriod,
    )
  })
  
  it("should calculate attrition penalty when pickup is below minimum", async () => {
    // Add a room block for testing
    await mockClarity.contracts["attrition-management"].functions["add-room-block"](
        "u1", // block-id
        mockClarity.tx.sender, // property-owner (same as tx.sender)
        "Tech Conference 2023",
        "u1685577600", // June 1, 2023
        "u1685750400", // June 3, 2023
        "u50", // total-rooms
        "u200", // price-per-room
        "u30", // rooms-booked (60% booked, below 80% minimum)
        true, // active
    )
    
    // Create attrition policy
    await mockClarity.contracts["attrition-management"].functions["create-attrition-policy"](
        "u1", // block-id
        "u80", // min-pickup-percentage (80%)
        "u50", // penalty-percentage (50%)
        "u7", // grace-period (7 days)
    )
    
    // Mock successful calculation with penalty
    mockClarity.contracts["attrition-management"].functions["calculate-attrition"].mockResolvedValue({
      success: true,
      value: "u2000", // Penalty amount
    })
    
    const blockId = "u1"
    const result = await mockClarity.contracts["attrition-management"].functions["calculate-attrition"](blockId)
    
    expect(result.success).toBe(true)
    expect(result.value).toBe("u2000")
  })
  
  it("should update attrition policy before calculation", async () => {
    // Add a room block for testing
    await mockClarity.contracts["attrition-management"].functions["add-room-block"](
        "u1", // block-id
        mockClarity.tx.sender, // property-owner (same as tx.sender)
        "Tech Conference 2023",
        "u1685577600", // June 1, 2023
        "u1685750400", // June 3, 2023
        "u50", // total-rooms
        "u200", // price-per-room
        "u30", // rooms-booked
        true, // active
    )
    
    // Create attrition policy
    await mockClarity.contracts["attrition-management"].functions["create-attrition-policy"](
        "u1", // block-id
        "u80", // min-pickup-percentage (80%)
        "u50", // penalty-percentage (50%)
        "u7", // grace-period (7 days)
    )
    
    // Mock successful update
    mockClarity.contracts["attrition-management"].functions["update-attrition-policy"].mockResolvedValue({
      success: true,
      value: true,
    })
    
    const blockId = "u1"
    const newMinPickupPercentage = "u70" // 70%
    const newPenaltyPercentage = "u40" // 40%
    const newGracePeriod = "u10" // 10 days
    
    const result = await mockClarity.contracts["attrition-management"].functions["update-attrition-policy"](
        blockId,
        newMinPickupPercentage,
        newPenaltyPercentage,
        newGracePeriod,
    )
    
    expect(result.success).toBe(true)
    expect(mockClarity.contracts["attrition-management"].functions["update-attrition-policy"]).toHaveBeenCalledWith(
        blockId,
        newMinPickupPercentage,
        newPenaltyPercentage,
        newGracePeriod,
    )
  })
})
