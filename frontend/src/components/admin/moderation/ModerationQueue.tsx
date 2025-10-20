'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { Modal } from '@/components/ui/Modal';
import { Tooltip } from '@/components/ui/Tooltip';

// GraphQL Queries and Mutations
const GET_MODERATION_QUEUE = `
  query GetModerationQueue($filters: ModerationQueueFilters) {
    getModerationQueue(filters: $filters) {
      id
      violation {
        id
        contentId
        contentType
        content
        violationType
        severity
        status
        confidence
        humanReview
        createdAt
        user {
          id
          username
          email
          role
          subscriptionTier
        }
      }
      priority
      timeInQueue
      userContext {
        user {
          id
          username
          role
          subscriptionTier
        }
        reputation {
          score
          totalViolations
          confirmedViolations
          trustLevel
          riskLevel
        }
        recentViolations {
          id
          violationType
          severity
          createdAt
        }
        activePenalties {
          id
          penaltyType
          status
          expiresAt
        }
      }
    }
  }
`;

const CONFIRM_VIOLATION = `
  mutation ConfirmViolation($input: ViolationReviewInput!) {
    confirmViolation(input: $input) {
      id
      status
    }
  }
`;

const MARK_FALSE_POSITIVE = `
  mutation MarkFalsePositive($input: FalsePositiveInput!) {
    markFalsePositive(input: $input) {
      id
      reason
    }
  }
`;

const PERFORM_BULK_ACTION = `
  mutation PerformBulkAction($action: BulkModerationAction!) {
    performBulkAction(action: $action) {
      id
      status
    }
  }
`;

interface ModerationQueueProps {
  onViolationSelect: (violationId: string) => void;
  onUserSelect: (userId: string) => void;
}

export const ModerationQueue: React.FC<ModerationQueueProps> = ({
  onViolationSelect,
  onUserSelect,
}) => {
  const [filters, setFilters] = useState({
    status: 'PENDING',
    violationType: '',
    severity: '',
    page: 1,
    limit: 20,
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkActionType, setBulkActionType] = useState<string>('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'priority', direction: 'desc' });

  // GraphQL operations
  const { data, loading, error, refetch } = useQuery(GET_MODERATION_QUEUE, {
    variables: { filters },
    fetchPolicy: 'cache-and-network',
    pollInterval: 30000, // Poll every 30 seconds
  });

  const [confirmViolation] = useMutation(CONFIRM_VIOLATION);
  const [markFalsePositive] = useMutation(MARK_FALSE_POSITIVE);
  const [performBulkAction] = useMutation(PERFORM_BULK_ACTION);

  const queueItems = data?.getModerationQueue || [];

  // Filter and sort queue items
  const processedItems = React.useMemo(() => {
    let items = [...queueItems];
    
    // Sort items
    items.sort((a, b) => {
      let aValue = a[sortConfig.key as keyof typeof a];
      let bValue = b[sortConfig.key as keyof typeof b];
      
      if (sortConfig.key === 'user') {
        aValue = a.violation.user.username;
        bValue = b.violation.user.username;
      } else if (sortConfig.key === 'createdAt') {
        aValue = new Date(a.violation.createdAt).getTime();
        bValue = new Date(b.violation.createdAt).getTime();
      }
      
      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return items;
  }, [queueItems, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(processedItems.map(item => item.id));
      setSelectedItems(allIds);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleQuickAction = async (itemId: string, action: 'confirm' | 'false-positive') => {
    try {
      if (action === 'confirm') {
        await confirmViolation({
          variables: {
            input: {
              violationId: processedItems.find(item => item.id === itemId)?.violation.id,
              action: 'CONFIRM',
            },
          },
        });
      } else {
        await markFalsePositive({
          variables: {
            input: {
              violationId: processedItems.find(item => item.id === itemId)?.violation.id,
              reason: 'Quick false positive mark',
            },
          },
        });
      }
      
      refetch();
    } catch (error) {
      console.error('Quick action failed:', error);
    }
  };

  const handleBulkAction = async () => {
    if (selectedItems.size === 0 || !bulkActionType) return;

    try {
      const violationIds = Array.from(selectedItems).map(itemId => 
        processedItems.find(item => item.id === itemId)?.violation.id
      ).filter(Boolean);

      await performBulkAction({
        variables: {
          action: {
            violationIds,
            action: bulkActionType,
            reason: `Bulk ${bulkActionType.toLowerCase()} action`,
          },
        },
      });

      setSelectedItems(new Set());
      setShowBulkModal(false);
      setBulkActionType('');
      refetch();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      LOW: 'success',
      MEDIUM: 'warning',
      HIGH: 'error',
      CRITICAL: 'error',
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'secondary'}>
        {severity}
      </Badge>
    );
  };

  const getViolationTypeBadge = (type: string) => {
    const colors = {
      TOXICITY: 'bg-red-100 text-red-800',
      RELIGIOUS_CONTENT: 'bg-purple-100 text-purple-800',
      HATE_SPEECH: 'bg-red-100 text-red-800',
      HARASSMENT: 'bg-orange-100 text-orange-800',
      SEXUAL_CONTENT: 'bg-pink-100 text-pink-800',
      SPAM: 'bg-yellow-100 text-yellow-800',
    } as const;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
      }`}>
        {type.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityIndicator = (priority: number) => {
    if (priority >= 90) return <div className="w-3 h-3 bg-red-500 rounded-full" title="Critical Priority" />;
    if (priority >= 70) return <div className="w-3 h-3 bg-orange-500 rounded-full" title="High Priority" />;
    if (priority >= 50) return <div className="w-3 h-3 bg-yellow-500 rounded-full" title="Medium Priority" />;
    return <div className="w-3 h-3 bg-green-500 rounded-full" title="Low Priority" />;
  };

  const formatTimeInQueue = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Queue</h3>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search content, users, or violations..."
              className="w-full"
              leftIcon={MagnifyingGlassIcon}
            />
          </div>
          
          <div className="flex gap-2">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}
              placeholder="Status"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="FALSE_POSITIVE">False Positive</option>
            </Select>

            <Select
              value={filters.violationType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, violationType: value, page: 1 }))}
              placeholder="Violation Type"
            >
              <option value="">All Types</option>
              <option value="TOXICITY">Toxicity</option>
              <option value="RELIGIOUS_CONTENT">Religious Content</option>
              <option value="HATE_SPEECH">Hate Speech</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="SEXUAL_CONTENT">Sexual Content</option>
              <option value="SPAM">Spam</option>
            </Select>

            <Select
              value={filters.severity}
              onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value, page: 1 }))}
              placeholder="Severity"
            >
              <option value="">All Severities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg mb-6">
            <span className="text-sm font-medium text-blue-900">
              {selectedItems.size} item(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBulkActionType('CONFIRM');
                  setShowBulkModal(true);
                }}
              >
                Confirm Selected
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setBulkActionType('FALSE_POSITIVE');
                  setShowBulkModal(true);
                }}
              >
                Mark as False Positive
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Queue Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.Row>
                <Table.HeaderCell>
                  <input
                    type="checkbox"
                    checked={selectedItems.size === processedItems.length && processedItems.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded"
                  />
                </Table.HeaderCell>
                <Table.HeaderCell 
                  onClick={() => handleSort('priority')}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  Priority
                </Table.HeaderCell>
                <Table.HeaderCell 
                  onClick={() => handleSort('violationType')}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  Violation
                </Table.HeaderCell>
                <Table.HeaderCell>Content Preview</Table.HeaderCell>
                <Table.HeaderCell 
                  onClick={() => handleSort('user')}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  User
                </Table.HeaderCell>
                <Table.HeaderCell 
                  onClick={() => handleSort('createdAt')}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  Time in Queue
                </Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                    <p className="mt-2 text-gray-500">Loading queue...</p>
                  </Table.Cell>
                </Table.Row>
              ) : processedItems.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} className="text-center py-8">
                    <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No violations found matching your filters</p>
                  </Table.Cell>
                </Table.Row>
              ) : (
                processedItems.map((item) => (
                  <Table.Row key={item.id} className="hover:bg-gray-50">
                    <Table.Cell>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                        className="rounded"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        {getPriorityIndicator(item.priority)}
                        <span className="text-sm font-medium">{item.priority}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="space-y-1">
                        {getViolationTypeBadge(item.violation.violationType)}
                        {getSeverityBadge(item.violation.severity)}
                        <div className="text-xs text-gray-500">
                          {Math.round(item.violation.confidence * 100)}% confidence
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="max-w-xs">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {item.violation.contentType.toUpperCase()}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {item.violation.content.substring(0, 100)}...
                        </p>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onUserSelect(item.violation.user.id)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {item.violation.user.username}
                        </button>
                        <Badge variant="secondary" size="sm">
                          {item.violation.user.role}
                        </Badge>
                        {item.userContext.reputation && (
                          <Tooltip content={`Trust: ${item.userContext.reputation.trustLevel}`}>
                            <Badge 
                              variant={item.userContext.reputation.riskLevel === 'HIGH' ? 'error' : 'secondary'}
                              size="sm"
                            >
                              {item.userContext.reputation.score}
                            </Badge>
                          </Tooltip>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {formatTimeInQueue(item.timeInQueue)}
                        </div>
                        <div className="text-gray-500">
                          {new Date(item.violation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        <Tooltip content="View Details">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViolationSelect(item.violation.id)}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Confirm Violation">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickAction(item.id, 'confirm')}
                            className="text-green-600 hover:text-green-800"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="Mark False Positive">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleQuickAction(item.id, 'false-positive')}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
                        </Tooltip>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t">
          <Pagination
            currentPage={filters.page}
            totalPages={Math.ceil(queueItems.length / filters.limit)}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
        </div>
      </Card>

      {/* Bulk Action Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Confirm Bulk Action"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to {bulkActionType.toLowerCase().replace('_', ' ')} {selectedItems.size} selected items?
          </p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              variant={bulkActionType === 'CONFIRM' ? 'primary' : 'error'}
            >
              Confirm Action
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModerationQueue;