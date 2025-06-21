import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaSync } from 'react-icons/fa';
import ContentCard from './ContentCard';
import { useSearch } from '../contexts/SearchContext';
import { API_URL } from '../api/config';
import './ContentList.css';

const ContentList = ({ contentType }) => {
  // Состояние для списка контента
  // ... existing code ...
} 