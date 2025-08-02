#!/usr/bin/env python3
"""
Centralized Ranking Service for Hybrid House
Handles all ranking calculations and leaderboard logic
"""

import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from supabase import create_client, Client
import json
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from the backend directory
backend_dir = Path(__file__).parent
load_dotenv(backend_dir / '.env')

class RankingService:
    def __init__(self):
        # Initialize Supabase client using the same environment variables as server.py
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')  # Use SERVICE_KEY for backend operations
        
        print(f"🔧 RankingService init - URL exists: {bool(supabase_url)}")
        print(f"🔧 RankingService init - Key exists: {bool(supabase_key)}")
        
        if supabase_url and supabase_key:
            try:
                self.supabase: Client = create_client(supabase_url, supabase_key)
                print("✅ RankingService: Supabase client initialized successfully")
            except Exception as e:
                print(f"❌ RankingService: Failed to create Supabase client: {e}")
                self.supabase = None
        else:
            print(f"❌ RankingService: Missing environment variables - URL: {bool(supabase_url)}, Key: {bool(supabase_key)}")
            self.supabase = None
    
    def get_public_leaderboard_data(self) -> List[Dict]:
        """Get all public profiles with complete scores for leaderboard"""
        if not self.supabase:
            raise Exception("Supabase client not initialized")
        
        try:
            # Get all public athlete profiles with complete scores
            profiles_response = self.supabase.table('athlete_profiles')\
                .select('''
                    id,
                    user_id,
                    profile_json,
                    score_data,
                    is_public,
                    updated_at
                ''')\
                .eq('is_public', True)\
                .not_.is_('score_data', 'null')\
                .execute()
            
            profiles = profiles_response.data
            
            if not profiles:
                return []
            
            # Get user profile data for age, gender, country information
            user_ids = [profile['user_id'] for profile in profiles if profile.get('user_id')]
            
            user_profiles_response = self.supabase.table('user_profiles')\
                .select('user_id, display_name, date_of_birth, gender, country')\
                .in_('user_id', user_ids)\
                .execute()
            
            user_profiles_map = {profile['user_id']: profile for profile in user_profiles_response.data}
            
            leaderboard_data = []
            
            for profile in profiles:
                score_data = profile.get('score_data', {})
                profile_json = profile.get('profile_json', {})
                user_id = profile.get('user_id')
                user_profile_data = user_profiles_map.get(user_id, {})
                
                # Ensure all required scores are present
                required_scores = ['hybridScore', 'strengthScore', 'speedScore', 'vo2Score', 
                                 'distanceScore', 'volumeScore', 'recoveryScore']
                
                if all(score in score_data for score in required_scores):
                    # Extract display_name with enhanced fallback logic
                    display_name = user_profile_data.get('display_name', '')
                    if not display_name:
                        # First fallback: try profile_json display_name
                        display_name = profile_json.get('display_name', '')
                        if not display_name:
                            # Second fallback: try first_name + last_name combination
                            first_name = profile_json.get('first_name', '').strip()
                            last_name = profile_json.get('last_name', '').strip()
                            if first_name and last_name:
                                display_name = f"{first_name} {last_name}"
                            elif first_name:
                                # Third fallback: just first_name
                                display_name = first_name
                            else:
                                # Final fallback: email prefix
                                email = profile_json.get('email', '')
                                display_name = email.split('@')[0] if email else f'User {profile.get("id", "")[:8]}'
                    
                    # Handle case where display_name might be incomplete (like "Nick" instead of "Nick Bare")
                    # If display_name exists but seems incomplete, enhance it with last_name if available
                    if display_name and len(display_name.split()) == 1:  # Single word display name
                        last_name = profile_json.get('last_name', '').strip()
                        if last_name and last_name.lower() not in display_name.lower():
                            display_name = f"{display_name} {last_name}"
                    
                    # Calculate age from date_of_birth
                    age = None
                    date_of_birth = user_profile_data.get('date_of_birth')
                    if date_of_birth:
                        from datetime import datetime, date
                        if isinstance(date_of_birth, str):
                            try:
                                birth_date = datetime.fromisoformat(date_of_birth.replace('Z', '+00:00')).date()
                            except:
                                birth_date = datetime.strptime(date_of_birth, '%Y-%m-%d').date()
                        else:
                            birth_date = date_of_birth
                        
                        today = date.today()
                        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                    
                    # Extract gender and country from user_profiles
                    gender = user_profile_data.get('gender', '').lower() if user_profile_data.get('gender') else None
                    country = user_profile_data.get('country', '') if user_profile_data.get('country') else None
                    
                    # Get country flag if available
                    country_flag = None
                    if country:
                        country_flags = {
                            'United States': '🇺🇸', 'USA': '🇺🇸', 'US': '🇺🇸',
                            'Canada': '🇨🇦', 'CA': '🇨🇦',
                            'United Kingdom': '🇬🇧', 'UK': '🇬🇧', 'GB': '🇬🇧',
                            'Australia': '🇦🇺', 'AU': '🇦🇺',
                            'Germany': '🇩🇪', 'DE': '🇩🇪',
                            'France': '🇫🇷', 'FR': '🇫🇷',
                            'Spain': '🇪🇸', 'ES': '🇪🇸',
                            'Italy': '🇮🇹', 'IT': '🇮🇹',
                            'Netherlands': '🇳🇱', 'NL': '🇳🇱',
                            'Sweden': '🇸🇪', 'SE': '🇸🇪',
                            'Norway': '🇳🇴', 'NO': '🇳🇴',
                            'Denmark': '🇩🇰', 'DK': '🇩🇰',
                            'Japan': '🇯🇵', 'JP': '🇯🇵',
                            'South Korea': '🇰🇷', 'KR': '🇰🇷',
                            'Brazil': '🇧🇷', 'BR': '🇧🇷',
                            'Mexico': '🇲🇽', 'MX': '🇲🇽'
                        }
                        country_flag = country_flags.get(country, country)
                    
                    leaderboard_data.append({
                        'profile_id': profile['id'],
                        'user_profile_id': profile['user_profile_id'],
                        'display_name': display_name,
                        'score': round(score_data['hybridScore'], 1),
                        'age': age,
                        'gender': gender,
                        'country': country,
                        'country_flag': country_flag,
                        'score_breakdown': {
                            'strengthScore': round(score_data['strengthScore'], 1),
                            'speedScore': round(score_data['speedScore'], 1), 
                            'vo2Score': round(score_data['vo2Score'], 1),
                            'distanceScore': round(score_data['distanceScore'], 1),
                            'volumeScore': round(score_data['volumeScore'], 1),
                            'recoveryScore': round(score_data['recoveryScore'], 1)
                        },
                        'updated_at': profile['updated_at']
                    })
            
            # Sort by hybrid score (highest to lowest) and deduplicate users
            leaderboard_data.sort(key=lambda x: x['score'], reverse=True)
            
            # Deduplicate users - show only highest score per user_profile_id
            seen_users = set()
            deduplicated_data = []
            
            for entry in leaderboard_data:
                user_profile_id = entry.get('user_profile_id')
                if user_profile_id not in seen_users:
                    seen_users.add(user_profile_id)
                    deduplicated_data.append(entry)
                # Skip entries for users we've already seen (they have lower scores due to sorting)
            
            # Add rank to each deduplicated entry
            for i, entry in enumerate(deduplicated_data):
                entry['rank'] = i + 1
            
            return deduplicated_data
            
        except Exception as e:
            raise Exception(f"Error fetching leaderboard data: {str(e)}")
    
    def calculate_hybrid_ranking(self, user_score: float, user_profile_id: str) -> Tuple[Optional[int], int]:
        """
        Calculate where user ranks among all public profiles
        
        Returns:
            Tuple[position, total_athletes] where:
            - position: User's rank (1-based), None if error
            - total_athletes: Total number of athletes to compare against
        """
        try:
            leaderboard_data = self.get_public_leaderboard_data()
            
            # Check if user is on public leaderboard
            user_position = None
            for i, entry in enumerate(leaderboard_data):
                if entry['profile_id'] == user_profile_id:
                    user_position = entry['rank']
                    break
            
            if user_position is not None:
                # User is on public leaderboard - return actual position
                return user_position, len(leaderboard_data)
            else:
                # User is not on public leaderboard (private profile)
                # Calculate hypothetical position
                hypothetical_position = 1
                for entry in leaderboard_data:
                    if entry['score'] > user_score:
                        hypothetical_position += 1
                    else:
                        break  # Since leaderboard is sorted, we can break early
                
                # Return hypothetical position with total including the user
                return hypothetical_position, len(leaderboard_data) + 1
                
        except Exception as e:
            print(f"Error calculating hybrid ranking: {str(e)}")
            return None, 0
    
    def get_leaderboard_stats(self) -> Dict:
        """Get comprehensive leaderboard statistics"""
        try:
            leaderboard_data = self.get_public_leaderboard_data()
            
            if not leaderboard_data:
                return {
                    'total_public_athletes': 0,
                    'score_range': {'min': 0, 'max': 0},
                    'avg_score': 0,
                    'percentile_breakpoints': {},
                    'last_updated': datetime.utcnow().isoformat()
                }
            
            scores = [entry['score'] for entry in leaderboard_data]
            
            # Calculate percentiles
            percentiles = {}
            for p in [25, 50, 75, 90, 95]:
                index = int((p / 100) * (len(scores) - 1))
                percentiles[f'p{p}'] = scores[index]
            
            return {
                'total_public_athletes': len(leaderboard_data),
                'score_range': {
                    'min': min(scores),
                    'max': max(scores)
                },
                'avg_score': sum(scores) / len(scores),
                'percentile_breakpoints': percentiles,
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            print(f"Error getting leaderboard stats: {str(e)}")
            return {
                'total_public_athletes': 0,
                'score_range': {'min': 0, 'max': 0},
                'avg_score': 0,
                'percentile_breakpoints': {},
                'last_updated': datetime.utcnow().isoformat(),
                'error': str(e)
            }
    
    def calculate_age_group_ranking(self, user_score: float, age_group: str) -> Tuple[Optional[int], int]:
        """
        Future: Calculate ranking within specific age group
        
        Args:
            user_score: User's hybrid score
            age_group: Age group string (e.g., "25-29")
            
        Returns:
            Tuple[position, total_athletes_in_age_group]
        """
        # Placeholder for future age-based ranking implementation
        # Will require joining with user_profiles table and filtering by age
        try:
            # TODO: Implement age-based ranking when needed
            # For now, return overall ranking
            return self.calculate_hybrid_ranking(user_score, None)
        except Exception as e:
            print(f"Error calculating age group ranking: {str(e)}")
            return None, 0

    def get_user_percentile(self, user_score: float) -> Optional[float]:
        """Calculate what percentile the user's score represents"""
        try:
            leaderboard_data = self.get_public_leaderboard_data()
            
            if not leaderboard_data:
                return None
                
            scores = [entry['score'] for entry in leaderboard_data]
            scores.append(user_score)  # Add user's score
            scores.sort(reverse=True)  # Sort highest to lowest
            
            user_position = scores.index(user_score) + 1
            percentile = ((len(scores) - user_position) / len(scores)) * 100
            
            return round(percentile, 1)
            
        except Exception as e:
            print(f"Error calculating user percentile: {str(e)}")
            return None

# Global instance for use in server.py - initialized immediately
ranking_service = RankingService()