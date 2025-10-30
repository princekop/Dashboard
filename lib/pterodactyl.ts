import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

interface PterodactylConfig {
  panelUrl: string
  apiKey: string
}

export class PterodactylService {
  private config: PterodactylConfig | null = null

  async getConfig(): Promise<PterodactylConfig | null> {
    if (this.config) return this.config

    const settings = await prisma.pterodactylSettings.findFirst({
      where: { isActive: true }
    })

    if (!settings) return null

    this.config = {
      panelUrl: settings.panelUrl,
      apiKey: settings.apiKey
    }

    return this.config
  }

  async createUser(email: string, username: string): Promise<number | null> {
    const config = await this.getConfig()
    if (!config) return null

    try {
      const response = await axios.post(
        `${config.panelUrl}/api/application/users`,
        {
          email,
          username: username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(),
          first_name: username.split(' ')[0] || 'User',
          last_name: username.split(' ').slice(1).join(' ') || 'Account'
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      return response.data.attributes.id
    } catch (error: any) {
      // User might already exist
      if (error.response?.status === 422) {
        return await this.getUserIdByEmail(email)
      }
      console.error('Failed to create Pterodactyl user:', error)
      return null
    }
  }

  async getUserIdByEmail(email: string): Promise<number | null> {
    const config = await this.getConfig()
    if (!config) return null

    try {
      const response = await axios.get(
        `${config.panelUrl}/api/application/users?filter[email]=${email}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'application/json'
          }
        }
      )

      if (response.data.data.length > 0) {
        return response.data.data[0].attributes.id
      }

      return null
    } catch (error) {
      console.error('Failed to get user by email:', error)
      return null
    }
  }

  async createServer(
    userId: number,
    name: string,
    ram: number,
    cpu: number,
    disk: number
  ): Promise<{ id: number; identifier: string } | null> {
    const config = await this.getConfig()
    if (!config) return null

    try {
      // Find an available allocation, starting with node 1
      const { nodeId, allocationId } = await this.findOrCreateAllocation(config)

      const response = await axios.post(
        `${config.panelUrl}/api/application/servers`,
        {
          name,
          user: userId,
          egg: 3, // Paper egg
          nest: 1, // Minecraft nest
          docker_image: 'ghcr.io/pterodactyl/yolks:java_21',
          startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}',
          environment: {
            SERVER_JARFILE: 'server.jar',
            BUILD_NUMBER: 'latest'
          },
          limits: {
            memory: ram * 1024, // Convert GB to MB
            swap: 0,
            disk: disk * 1024, // Convert GB to MB
            io: 500,
            cpu: cpu * 100 // Convert cores to percentage
          },
          feature_limits: {
            databases: 2,
            backups: 1,
            allocations: 1
          },
          allocation: {
            default: allocationId
          },
          deploy: {
            locations: [nodeId],
            dedicated_ip: false,
            port_range: []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      return {
        id: response.data.attributes.id,
        identifier: response.data.attributes.identifier
      }
    } catch (error: any) {
      console.error('Failed to create server:', error.response?.data || error.message)
      if (error.response?.status === 422) {
        console.error('Validation errors:', JSON.stringify(error.response.data.errors, null, 2))
      }
      throw error
    }
  }

  private async findOrCreateAllocation(config: PterodactylConfig): Promise<{ nodeId: number; allocationId: number }> {
    try {
      // Get all nodes
      const nodesResponse = await axios.get(
        `${config.panelUrl}/api/application/nodes`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'application/json'
          }
        }
      )

      const nodes = nodesResponse.data.data
      
      // Prioritize node 1, then try others
      const sortedNodes = nodes.sort((a: any, b: any) => {
        if (a.attributes.id === 1) return -1
        if (b.attributes.id === 1) return 1
        return 0
      })

      // Try each node to find a free allocation
      for (const node of sortedNodes) {
        const nodeId = node.attributes.id
        
        try {
          // Get allocations for this node
          const allocationsResponse = await axios.get(
            `${config.panelUrl}/api/application/nodes/${nodeId}/allocations`,
            {
              headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Accept': 'application/json'
              }
            }
          )

          // Find unassigned allocation
          const availableAllocation = allocationsResponse.data.data.find(
            (alloc: any) => !alloc.attributes.assigned
          )

          if (availableAllocation) {
            return {
              nodeId,
              allocationId: availableAllocation.attributes.id
            }
          }

          // Try to create a new allocation on this node
          try {
            const nodeDetails = await axios.get(
              `${config.panelUrl}/api/application/nodes/${nodeId}`,
              {
                headers: {
                  'Authorization': `Bearer ${config.apiKey}`,
                  'Accept': 'application/json'
                }
              }
            )

            const nodeFqdn = nodeDetails.data.attributes.fqdn
            
            const createAllocationResponse = await axios.post(
              `${config.panelUrl}/api/application/nodes/${nodeId}/allocations`,
              {
                ip: nodeFqdn,
                ports: ['25565'] // Default Minecraft port
              },
              {
                headers: {
                  'Authorization': `Bearer ${config.apiKey}`,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                }
              }
            )

            if (createAllocationResponse.data.attributes) {
              return {
                nodeId,
                allocationId: createAllocationResponse.data.attributes.id
              }
            }
          } catch (createError) {
            console.log(`Could not create allocation on node ${nodeId}, trying next node...`)
            continue
          }
        } catch (nodeError) {
          console.log(`Error checking node ${nodeId}, trying next node...`)
          continue
        }
      }

      throw new Error('No available allocations on any node')
    } catch (error) {
      console.error('Failed to find or create allocation:', error)
      throw error
    }
  }

  async suspendServer(serverId: number): Promise<boolean> {
    const config = await this.getConfig()
    if (!config) return false

    try {
      await axios.post(
        `${config.panelUrl}/api/application/servers/${serverId}/suspend`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'application/json'
          }
        }
      )
      return true
    } catch (error) {
      console.error('Failed to suspend server:', error)
      return false
    }
  }

  async unsuspendServer(serverId: number): Promise<boolean> {
    const config = await this.getConfig()
    if (!config) return false

    try {
      await axios.post(
        `${config.panelUrl}/api/application/servers/${serverId}/unsuspend`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'application/json'
          }
        }
      )
      return true
    } catch (error) {
      console.error('Failed to unsuspend server:', error)
      return false
    }
  }

  async deleteServer(serverId: number): Promise<boolean> {
    const config = await this.getConfig()
    if (!config) return false

    try {
      await axios.delete(
        `${config.panelUrl}/api/application/servers/${serverId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Accept': 'application/json'
          }
        }
      )
      return true
    } catch (error) {
      console.error('Failed to delete server:', error)
      return false
    }
  }

  async resetUserPassword(userId: number): Promise<string | null> {
    const config = await this.getConfig()
    if (!config) return null

    const newPassword = this.generatePassword()

    try {
      await axios.patch(
        `${config.panelUrl}/api/application/users/${userId}`,
        {
          password: newPassword
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )

      return newPassword
    } catch (error) {
      console.error('Failed to reset password:', error)
      return null
    }
  }

  private generatePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
}

export const pterodactylService = new PterodactylService()
