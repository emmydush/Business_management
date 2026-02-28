import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import { FiMapPin, FiCheck, FiRefreshCw } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';


const BranchSwitcher = () => {
    
    const [branches, setBranches] = useState([]);
    const [currentBranch, setCurrentBranch] = useState(null);
    const [loading, setLoading] = useState(false);
    const [switching, setSwitching] = useState(false);

    useEffect(() => {
        fetchAccessibleBranches();
    }, []);

    const fetchAccessibleBranches = async () => {
        setLoading(true);
        try {
            const response = await api.get('');

            setBranches(response.data.branches);

            // Set current branch (the default one)
            const defaultBranch = response.data.branches.find(b => b.is_default);
            if (defaultBranch) {
                setCurrentBranch(defaultBranch);
            } else if (response.data.branches.length > 0) {
                // If no default, use the first branch
                setCurrentBranch(response.data.branches[0]);
            }
        } catch (error) {
            console.error('Error fetching branches:', error);
            toast.error("failed_load_branches");
        } finally {
            setLoading(false);
        }
    };

    const handleBranchSwitch = async (branchId) => {
        if (currentBranch && currentBranch.id === branchId) {
            return; // Already on this branch
        }

        setSwitching(true);
        try {
            const response = await api.post(`/branches/switch/${branchId}`);

            const newBranch = response.data.branch;
            setCurrentBranch(newBranch);

            // Update branches list to reflect new default
            setBranches(prevBranches =>
                prevBranches.map(b => ({
                    ...b,
                    is_default: b.id === branchId
                }))
            );

            toast.success(`${"switched_to"} ${newBranch.name}`, {
                icon: '🏢',
                duration: 3000
            });

            // Optionally reload the page to refresh branch-specific data
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            console.error('Error switching branch:', error);
            toast.error(error.response?.data?.error || "failed_switch_branch");
        } finally {
            setSwitching(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex align-items-center px-3">
                <Spinner animation="border" size="sm" />
            </div>
        );
    }

    // Show the switcher even if no branches (will show "No Branches" or similar)
    // if (!branches || branches.length === 0) {
    //     return null;
    // }

    return (
        <Dropdown align="end" className="branch-switcher-dropdown">
            <Dropdown.Toggle
                variant="link"
                className="text-dark d-flex align-items-center p-2 text-decoration-none branch-switcher-btn"
                disabled={switching}
            >
                <div className="branch-icon-wrapper">
                    {switching ? (
                        <Spinner animation="border" size="sm" />
                    ) : (
                        <FiMapPin size={18} />
                    )}
                </div>
                <div className="d-none d-lg-flex flex-column align-items-start ms-2">
                    <span className="small text-muted" style={{ fontSize: '10px' }}>{"branch_label"}</span>
                    <span className="fw-semibold small text-dark line-height-1">
                        {currentBranch ? currentBranch.name : "select_branch"}
                    </span>
                </div>
            </Dropdown.Toggle>

            <Dropdown.Menu className="border-0 shadow-xl mt-2 branch-menu animate-in">
                <div className="px-3 py-2 border-bottom bg-light-subtle">
                    <h6 className="mb-0 fw-bold d-flex align-items-center">
                        <FiMapPin className="me-2 text-primary" />
                        {"switch_branch"}
                    </h6>
                    <small className="text-muted">{"select_location"}</small>
                </div>

                <div className="p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {branches.map((branch) => (
                        <Dropdown.Item
                            key={branch.id}
                            onClick={() => handleBranchSwitch(branch.id)}
                            className={`rounded-3 py-2 px-3 mb-1 ${currentBranch && currentBranch.id === branch.id ? 'active-branch' : ''}`}
                            disabled={switching}
                        >
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center">
                                    <div className={`branch-indicator ${currentBranch && currentBranch.id === branch.id ? 'active' : ''}`}>
                                        {currentBranch && currentBranch.id === branch.id && (
                                            <FiCheck size={14} />
                                        )}
                                    </div>
                                    <div className="ms-2">
                                        <div className="fw-semibold text-dark small">{branch.name}</div>
                                        {branch.code && (
                                            <div className="text-muted extra-small">{branch.code}</div>
                                        )}
                                        {branch.city && (
                                            <div className="text-muted extra-small">{branch.city}</div>
                                        )}
                                    </div>
                                </div>
                                {branch.is_headquarters && (
                                    <Badge bg="primary" className="small">{"hq_badge"}</Badge>
                                )}
                            </div>
                        </Dropdown.Item>
                    ))}
                </div>

                <div className="px-3 py-2 border-top bg-light-subtle text-center">
                    <button
                        className="btn btn-link btn-sm p-0 text-decoration-none d-flex align-items-center justify-content-center w-100"
                        onClick={fetchAccessibleBranches}
                        disabled={loading}
                    >
                        <FiRefreshCw size={14} className="me-1" />
                        <span className="small">{"refresh_branches"}</span>
                    </button>
                </div>
            </Dropdown.Menu>

            <style dangerouslySetInnerHTML={{
                __html: `
                .branch-switcher-btn {
                    padding: 4px 8px !important;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }

                .branch-switcher-btn:hover {
                    background: rgba(255, 255, 255, 0.15) !important;
                }

                .branch-icon-wrapper {
                    width: 36px;
                    height: 36px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ffffff;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }

                .branch-switcher-btn:hover .branch-icon-wrapper {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-1px);
                }

                .branch-menu {
                    border-radius: 16px !important;
                    min-width: 280px;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
                    border: 1px solid rgba(102, 126, 234, 0.1);
                    overflow: hidden;
                }

                .branch-indicator {
                    width: 20px;
                    height: 20px;
                    background: #f1f5f9;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .branch-indicator.active {
                    background: #6366f1;
                    color: white;
                }

                .active-branch {
                    background: rgba(99, 102, 241, 0.05) !important;
                    border-left: 3px solid #6366f1;
                }

                .dropdown-item:active {
                    background: rgba(99, 102, 241, 0.1) !important;
                }

                .line-height-1 {
                    line-height: 1.2;
                }

                .extra-small {
                    font-size: 10px;
                }

                .animate-in {
                    animation: slideUp 0.2s ease;
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                /* Text colors for the dropdown toggle - default to dark for light backgrounds */
                .branch-switcher-btn .text-dark {
                    color: #1e293b !important;
                }
                
                .branch-switcher-btn .text-muted {
                    color: #64748b !important;
                }

                /* White text when inside the custom navbar */
                .navbar-custom .branch-switcher-btn .text-dark {
                    color: #ffffff !important;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.1);
                }
                
                .navbar-custom .branch-switcher-btn .text-muted {
                    color: rgba(255, 255, 255, 0.8) !important;
                }

                /* Fix for dropdown menu text visibility */
                .branch-menu .text-dark,
                .branch-menu .fw-semibold,
                .branch-menu .fw-bold,
                .branch-menu h6 {
                    color: #1e293b !important;
                    text-shadow: none !important;
                }

                .branch-menu .text-muted,
                .branch-menu .extra-small,
                .branch-menu small {
                    color: #64748b !important;
                }
                
                .active-branch .fw-semibold,
                .active-branch .text-dark {
                    color: #6366f1 !important;
                }

                .branch-menu .dropdown-item {
                    color: #1e293b !important;
                }

                .branch-menu .dropdown-item:hover {
                    background-color: rgba(99, 102, 241, 0.05) !important;
                }
            `}} />
        </Dropdown>
    );
};

export default BranchSwitcher;

