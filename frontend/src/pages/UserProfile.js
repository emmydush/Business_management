import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Image } from 'react-bootstrap';
import { authAPI, getImageUrl } from '../services/api';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiPhone, FiCamera, FiSave, FiEdit2 } from 'react-icons/fi';

const UserProfile = () => {
    const [profile, setProfile] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        profile_picture: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [previewImage, setPreviewImage] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await authAPI.getProfile();
            setProfile(response.data.user);
            setPreviewImage(getImageUrl(response.data.user.profile_picture) || '');
            setError(null);
        } catch (err) {
            setError('Failed to fetch user profile.');
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Create a preview URL for the selected image
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload the image
            uploadProfilePicture(file);
        }
    };

    const uploadProfilePicture = async (file) => {
        try {
            setUploading(true);
            const response = await authAPI.uploadProfilePicture(file);

            // Update the profile with the new picture URL
            setProfile(prev => ({
                ...prev,
                profile_picture: response.data.url
            }));

            toast.success('Profile picture uploaded successfully!');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast.error('Failed to upload profile picture');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await authAPI.updateProfile({
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
                email: profile.email,
                profile_picture: profile.profile_picture
            });

            setProfile(response.data.user);

            // Update user data in localStorage
            localStorage.setItem('user', JSON.stringify(response.data.user));

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.error || error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <Container fluid className="py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <div>
                    <h2 className="fw-bold text-dark mb-1">User Profile</h2>
                    <p className="text-muted mb-0">Manage your personal information and profile picture</p>
                </div>
                <div className="d-flex gap-2 mt-3 mt-md-0">
                    <Button variant="outline-secondary" className="d-flex align-items-center" onClick={fetchProfile}>
                        <FiEdit2 className="me-2" /> Refresh
                    </Button>
                </div>
            </div>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col lg={8}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Personal Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row className="g-3">
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">First Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="first_name"
                                                value={profile.first_name}
                                                onChange={handleChange}
                                                placeholder="Enter first name"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Last Name *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="last_name"
                                                value={profile.last_name}
                                                onChange={handleChange}
                                                placeholder="Enter last name"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Email *</Form.Label>
                                            <Form.Control
                                                type="email"
                                                name="email"
                                                value={profile.email}
                                                onChange={handleChange}
                                                placeholder="Enter email address"
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label className="small fw-bold">Phone</Form.Label>
                                            <Form.Control
                                                type="tel"
                                                name="phone"
                                                value={profile.phone}
                                                onChange={handleChange}
                                                placeholder="Enter phone number"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <div className="d-flex justify-content-end mt-4">
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={saving}
                                        className="d-flex align-items-center"
                                    >
                                        {saving ? (
                                            <>
                                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                                    <span className="visually-hidden">Saving...</span>
                                                </div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <FiSave className="me-2" /> Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={4}>
                    <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Profile Picture</h5>
                        </Card.Header>
                        <Card.Body className="text-center">
                            <div className="position-relative d-inline-block mb-3">
                                {previewImage ? (
                                    <Image
                                        src={previewImage}
                                        alt="Profile"
                                        roundedCircle
                                        className="img-fluid"
                                        style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                                        <FiUser className="text-muted" size={40} />
                                    </div>
                                )}

                                <label
                                    htmlFor="profilePictureInput"
                                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-2 cursor-pointer"
                                    style={{ transform: 'translate(20%, 20%)' }}
                                >
                                    <FiCamera size={18} />
                                    <input
                                        id="profilePictureInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                            </div>

                            <p className="text-muted small mt-2">
                                {uploading ? 'Uploading...' : 'Click camera icon to upload a new photo'}
                            </p>

                            <div className="border-top pt-3 mt-3">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Name:</span>
                                    <span className="fw-bold">{profile.first_name} {profile.last_name}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted">Email:</span>
                                    <span className="fw-bold">{profile.email}</span>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-muted">Phone:</span>
                                    <span className="fw-bold">{profile.phone || 'Not provided'}</span>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 shadow-sm mt-4">
                        <Card.Header className="bg-white border-0 py-3">
                            <h5 className="fw-bold mb-0">Account Information</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="small text-muted">
                                Your profile information is securely stored and used for identification purposes.
                                Keep your contact details up to date for important notifications.
                            </p>
                            <div className="d-flex align-items-center text-success">
                                <span className="small">Profile is secured</span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default UserProfile;